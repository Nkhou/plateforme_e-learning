# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Course, Subscription, CourseContent, QCM, QCMCompletion, QCMAttempt
from .serializers import CourseSerializer, SubscriptionWithProgressSerializer, QCMCompletionSerializer

class CourseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.course_id = self.scope['url_route']['kwargs']['course_id']
        self.course_group_name = f'course_{self.course_id}'
        
        # Authenticate user
        user = self.scope["user"]
        if isinstance(user, AnonymousUser):
            await self.close()
            return
        
        # Check if user has access to this course
        has_access = await self.check_course_access(user, self.course_id)
        if not has_access:
            await self.close()
            return
        
        # Join course group
        await self.channel_layer.group_add(
            self.course_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial progress data
        progress_data = await self.get_user_progress(user, self.course_id)
        await self.send(text_data=json.dumps({
            'type': 'progress_update',
            'data': progress_data
        }))

    async def disconnect(self, close_code):
        # Leave course group
        await self.channel_layer.group_discard(
            self.course_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']
        user = self.scope["user"]
        
        if message_type == 'content_completed':
            content_id = text_data_json['content_id']
            await self.handle_content_completed(user, content_id)
            
        elif message_type == 'qcm_submission':
            content_id = text_data_json['content_id']
            selected_options = text_data_json['selected_options']
            time_taken = text_data_json.get('time_taken', 0)
            await self.handle_qcm_submission(user, content_id, selected_options, time_taken)
            
        elif message_type == 'progress_request':
            progress_data = await self.get_user_progress(user, self.course_id)
            await self.send(text_data=json.dumps({
                'type': 'progress_update',
                'data': progress_data
            }))
        elif message_type == 'content_created':
            # Handle notification when new content is created
            content_data = text_data_json['content']
            await self.handle_content_created(content_data)

    # Handle content completion
    async def handle_content_completed(self, user, content_id):
        result = await self.mark_content_completed(user, self.course_id, content_id)
        
        if 'error' in result:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': result['error']
            }))
        else:
            # Send update to this user
            await self.send(text_data=json.dumps({
                'type': 'content_completed',
                'content_id': content_id,
                'progress': result['progress']
            }))
            
            # Broadcast to group if needed (for real-time leaderboard updates)
            leaderboard_data = await self.get_leaderboard_data(self.course_id)
            await self.channel_layer.group_send(
                self.course_group_name,
                {
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }
            )

    # Handle QCM submission
    async def handle_qcm_submission(self, user, content_id, selected_option_ids, time_taken):
        result = await self.submit_qcm_answer(
            user, self.course_id, content_id, selected_option_ids, time_taken
        )
        
        if 'error' in result:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': result['error']
            }))
        else:
            # Send result to user
            await self.send(text_data=json.dumps({
                'type': 'qcm_result',
                'data': result
            }))
            
            # Update leaderboard for all users
            leaderboard_data = await self.get_leaderboard_data(self.course_id)
            await self.channel_layer.group_send(
                self.course_group_name,
                {
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }
            )
    # Handle content creation notification
    async def handle_content_created(self, content_data):
        # Broadcast new content to all users in the course
        await self.channel_layer.group_send(
            self.course_group_name,
            {
                'type': 'content_created',
                'data': content_data
            }
        )
    # Handler for group messages
    async def leaderboard_update(self, event):
        # Send leaderboard update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_update',
            'data': event['data']
        }))

    # Database operations
    @database_sync_to_async
    def check_course_access(self, user, course_id):
        try:
            course = Course.objects.get(id=course_id)
            subscription = Subscription.objects.filter(
                user=user, 
                course=course, 
                is_active=True
            ).exists()
            return subscription
        except Course.DoesNotExist:
            return False

    @database_sync_to_async
    def get_user_progress(self, user, course_id):
        try:
            course = Course.objects.get(id=course_id)
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            serializer = SubscriptionWithProgressSerializer(subscription)
            return serializer.data
        except (Course.DoesNotExist, Subscription.DoesNotExist):
            return {'error': 'Subscription not found'}

    @database_sync_to_async
    def mark_content_completed(self, user, course_id, content_id):
        try:
            course = Course.objects.get(id=course_id)
            content = CourseContent.objects.get(id=content_id, course=course)
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            
            # Add content to completed contents
            subscription.completed_contents.add(content)
            
            # Update progress percentage
            total_contents = course.contents.count()
            completed_count = subscription.completed_contents.count()
            if total_contents > 0:
                subscription.progress_percentage = (completed_count / total_contents) * 100
            
            subscription.save()
            
            return {
                'progress': subscription.progress_percentage
            }
        except (Course.DoesNotExist, CourseContent.DoesNotExist, Subscription.DoesNotExist):
            return {'error': 'Content or subscription not found'}

    @database_sync_to_async
    def submit_qcm_answer(self, user, course_id, content_id, selected_option_ids, time_taken):
        try:
            course = Course.objects.get(id=course_id)
            content = CourseContent.objects.get(id=content_id, course=course)
            
            if content.content_type.name != 'QCM':
                return {'error': 'Content is not a QCM'}
            
            qcm = content.qcm
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            
            # Check if user can attempt
            completion, created = QCMCompletion.objects.get_or_create(
                subscription=subscription,
                qcm=qcm
            )
            
            if completion.attempts_count >= qcm.max_attempts:
                return {'error': 'Maximum attempts reached'}
            
            # Create new attempt
            attempt_number = completion.attempts_count + 1
            from django.utils import timezone
            attempt = QCMAttempt.objects.create(
                user=user,
                qcm=qcm,
                attempt_number=attempt_number,
                time_taken=time_taken
            )
            
            # Add selected options
            from .models import QCMOption
            selected_options = QCMOption.objects.filter(id__in=selected_option_ids, qcm=qcm)
            attempt.selected_options.set(selected_options)
            
            # Calculate score
            attempt.calculate_score()
            attempt.completed_at = timezone.now()
            attempt.save()
            
            # Update completion record
            completion.attempts_count = attempt_number
            if attempt.score > completion.best_score:
                completion.best_score = attempt.score
                completion.points_earned = attempt.points_earned
                completion.is_passed = attempt.is_passed
            completion.save()
            
            # Update total score
            subscription.update_total_score()
            
            return {
                'score': attempt.score,
                'points_earned': attempt.points_earned,
                'is_passed': attempt.is_passed,
                'attempt_number': attempt_number,
                'total_attempts': qcm.max_attempts,
                'remaining_attempts': qcm.max_attempts - attempt_number,
                'total_score': subscription.total_score
            }
        except (Course.DoesNotExist, CourseContent.DoesNotExist, Subscription.DoesNotExist):
            return {'error': 'Not found'}

    @database_sync_to_async
    def get_leaderboard_data(self, course_id):
        try:
            course = Course.objects.get(id=course_id)
            
            # Get top subscribers by score
            leaderboard = course.course_subscriptions.filter(
                is_active=True
            ).order_by('-score', '-progress_percentage')[:10]
            
            serializer = SubscriptionWithProgressSerializer(leaderboard, many=True)
            
            return {
                'course': course.title_of_course,
                'leaderboard': serializer.data
            }
        except Course.DoesNotExist:
            return {'error': 'Course not found'}