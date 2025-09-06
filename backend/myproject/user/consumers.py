# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from .models import Course, Subscription, CourseContent, QCM, QCMCompletion, QCMAttempt, QCMOption
from .serializers import CourseSerializer, SubscriptionWithProgressSerializer, QCMCompletionSerializer


class CourseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.course_id = self.scope['url_route']['kwargs']['course_id']
        self.course_group_name = f'course_{self.course_id}'
        
        # Authenticate user
        user = self.scope["user"]
        if isinstance(user, AnonymousUser):
            await self.close(code=4001)  # Custom close code for unauthorized
            return
        
        # Check if user has access to this course
        has_access = await self.check_course_access(user, self.course_id)
        if not has_access:
            await self.close(code=4003)  # Custom close code for access denied
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
        if hasattr(self, 'course_group_name'):
            await self.channel_layer.group_discard(
                self.course_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
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
                # Only allow creators to send content creation notifications
                if await self.is_course_creator(user, self.course_id):
                    content_data = text_data_json['content']
                    await self.handle_content_created(content_data)
                else:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Permission denied'
                    }))
                    
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except KeyError as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Missing required field: {str(e)}'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))

    async def handle_content_completed(self, user, content_id):
        # Validate that content belongs to the course
        content_belongs = await self.validate_content_belongs_to_course(content_id, self.course_id)
        if not content_belongs:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Content does not belong to this course'
            }))
            return
            
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

    async def handle_qcm_submission(self, user, content_id, selected_option_ids, time_taken):
        # Validate that content belongs to the course
        content_belongs = await self.validate_content_belongs_to_course(content_id, self.course_id)
        if not content_belongs:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Content does not belong to this course'
            }))
            return
            
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

    async def handle_content_created(self, content_data):
        # Broadcast new content to all users in the course
        await self.channel_layer.group_send(
            self.course_group_name,
            {
                'type': 'content_created',
                'data': content_data
            }
        )

    async def leaderboard_update(self, event):
        # Send leaderboard update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_update',
            'data': event['data']
        }))

    async def content_created(self, event):
        # Send content created notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'content_created',
            'data': event['data']
        }))

    # Database operations
    @database_sync_to_async
    def check_course_access(self, user, course_id):
        try:
            return Subscription.objects.filter(
                user=user, 
                course_id=course_id, 
                is_active=True
            ).exists()
        except Exception:
            return False

    @database_sync_to_async
    def is_course_creator(self, user, course_id):
        try:
            course = Course.objects.get(id=course_id)
            return course.creator == user
        except ObjectDoesNotExist:
            return False

    @database_sync_to_async
    def validate_content_belongs_to_course(self, content_id, course_id):
        try:
            return CourseContent.objects.filter(
                id=content_id, 
                course_id=course_id
            ).exists()
        except Exception:
            return False

    @database_sync_to_async
    def get_user_progress(self, user, course_id):
        try:
            subscription = Subscription.objects.select_related('course').get(
                user=user, 
                course_id=course_id, 
                is_active=True
            )
            serializer = SubscriptionWithProgressSerializer(subscription)
            return serializer.data
        except ObjectDoesNotExist:
            return {'error': 'Subscription not found'}

    @database_sync_to_async
    def mark_content_completed(self, user, course_id, content_id):
        try:
            subscription = Subscription.objects.select_related('course').get(
                user=user, 
                course_id=course_id, 
                is_active=True
            )
            
            content = CourseContent.objects.get(id=content_id, course_id=course_id)
            
            # Add content to completed contents if not already
            if not subscription.completed_contents.filter(id=content_id).exists():
                subscription.completed_contents.add(content)
                
                # Update progress percentage
                total_contents = subscription.course.contents.count()
                completed_count = subscription.completed_contents.count()
                if total_contents > 0:
                    subscription.progress_percentage = (completed_count / total_contents) * 100
                
                subscription.save()
            
            return {
                'progress': subscription.progress_percentage
            }
        except ObjectDoesNotExist:
            return {'error': 'Content or subscription not found'}

    @database_sync_to_async
    def submit_qcm_answer(self, user, course_id, content_id, selected_option_ids, time_taken):
        try:
            subscription = Subscription.objects.select_related('course').get(
                user=user, 
                course_id=course_id, 
                is_active=True
            )
            
            content = CourseContent.objects.select_related('qcm').get(
                id=content_id, 
                course_id=course_id
            )
            
            if not hasattr(content, 'qcm') or content.qcm is None:
                return {'error': 'Content is not a QCM'}
            
            qcm = content.qcm
            
            # Check if user can attempt
            completion, created = QCMCompletion.objects.get_or_create(
                subscription=subscription,
                qcm=qcm
            )
            
            if completion.attempts_count >= qcm.max_attempts:
                return {'error': 'Maximum attempts reached'}
            
            # Create new attempt
            attempt_number = completion.attempts_count + 1
            attempt = QCMAttempt.objects.create(
                user=user,
                qcm=qcm,
                attempt_number=attempt_number,
                time_taken=time_taken
            )
            
            # Add selected options
            selected_options = QCMOption.objects.filter(
                id__in=selected_option_ids, 
                qcm=qcm
            )
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
        except ObjectDoesNotExist:
            return {'error': 'Not found'}

    @database_sync_to_async
    def get_leaderboard_data(self, course_id):
        try:
            course = Course.objects.get(id=course_id)
            
            # Get top subscribers by score
            leaderboard = course.course_subscriptions.select_related('user').filter(
                is_active=True
            ).order_by('-total_score', '-progress_percentage')[:10]
            
            serializer = SubscriptionWithProgressSerializer(leaderboard, many=True)
            
            return {
                'course': course.title_of_course,
                'leaderboard': serializer.data
            }
        except ObjectDoesNotExist:
            return {'error': 'Course not found'}