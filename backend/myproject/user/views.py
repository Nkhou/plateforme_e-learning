
# Create your views here.
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import SubscriptionWithProgressSerializer  # Fixed import
from django.contrib.auth import authenticate
import logging
import jwt
from django.contrib.auth.hashers import make_password
from django.utils.crypto import get_random_string
from django.conf import settings

logger = logging.getLogger(__name__)

class UserView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        serializer = CustomUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        logger.info(f"Request data: {request.data}")
        user = get_object_or_404(CustomUser, pk=pk)
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            logger.info(f"Valid data: {serializer.validated_data}")
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.error(f"Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        user.delete()
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
import json
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class LoginView(APIView):
    def post(self, request):
        try:
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                try:
                    data = json.loads(request.body)
                except json.JSONDecodeError as e:
                    logger.error(f"JSON parse error: {e}")
                    return Response(
                        {"error": f"Invalid JSON format: {str(e)}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                data = request.data
            
            email = data.get('email')
            password = data.get('password')
            
            # Validate input
            if not email or not password:
                return Response(
                    {"error": "Email and password are required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find user by email
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {"error": "Invalid credentials."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Authenticate user
            user = authenticate(request, username=user_obj.username, password=password)
            if user is None:
                return Response(
                    {"error": "Invalid credentials."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user is active
            if not user.is_active:
                return Response(
                    {"error": "Account is disabled."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            response = Response({
                'refresh': str(refresh),
                'access': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            }, status=status.HTTP_200_OK)
            
            # Set HTTP-only cookie
            response.set_cookie(
                key='accessToken',
                value=access_token,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite='Lax',
                max_age=60 * 60 * 24  # 24 hours
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {"error": "An internal server error occurred."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"}, status=200)
        response.delete_cookie('accessToken')
        return response

class CheckAuthentificationView(APIView):
    def get(self, request):

        try:
            token = request.COOKIES.get('accessToken')
            if not token:
                return Response({
                    'authenticated': False, 
                    'debug': 'authenticated1', 
                    'message': 'No token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            print("-----------------------------",payload.get('username'))
            UserById_ = CustomUser.objects.filter(id=payload.get('user_id')).first()

            user = {
                "user_id": payload.get('user_id'),
                "username": UserById_.username,
                "firstname": UserById_.first_name,
                "lastName": UserById_.last_name,
                "email": UserById_.email,
                "Privilege": UserById_.Privilege
            }
            return Response({
                'authenticated': True, 
                'debug': 'authenticated2', 
                'user': user
            }, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            response = Response({
                'authenticated': False, 
                'debug': 'authenticated3', 
                'message': 'Token expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie('accessToken')
            return Response

        except jwt.InvalidTokenError:
            request.delete_cookie('accessToken')
            return Response({
                'authenticated': False, 
                'debug': 'authenticated4', 
                'message': 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)

class DashboardView(APIView):
    def get(self, request):
        token = request.COOKIES.get('accessToken')
        if not token:
            return Response({'authenticated': False, 'message': 'No token'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return Response({'authenticated': True, 'user_id': payload.get('user_id')})
        except jwt.ExpiredSignatureError:
            return Response({'authenticated': False, 'message': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'authenticated': False, 'message': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

import secrets
import string

import string
import secrets
from django.contrib.auth.hashers import make_password

def generate_random_password():
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(12))

class RegisterwithoutFileView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            first_name = request.data.get('firstName', '').strip()
            last_name = request.data.get('lastName', '').strip()
            privilege = request.data.get('Privilege', 'AP').strip().upper()
            if not all([email, first_name, last_name]):
                missing = [field for field in ['email', 'firstName', 'lastName'] 
                         if not request.data.get(field)]
                return Response(
                    {
                        "error": "All fields are required",
                        "missing_fields": missing
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if CustomUser.objects.filter(email=email).exists():
                return Response(
                    {"error": "Email already in use"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            password = generate_random_password()
            username = f"{first_name.lower()}_{last_name.lower()}"[:150]
            username = ''.join(c for c in username if c.isalnum() or c in '._-')

            user_data = {
                'username': username,
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'Privilege': privilege,
                'password': password
            }

            serializer = CustomUserSerializer(data=user_data)
            
            if serializer.is_valid():
                user = serializer.save()
                return Response(
                    {
                        "message": "User registered successfully",
                        "username": username,
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                print("Serializer errors:", serializer.errors)
                return Response(
                    {
                        "error": "Invalid data",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework.parsers import MultiPartParser
import csv
from io import TextIOWrapper

class CSVUploadView(APIView):
    def post(self, request):
        csv_file = request.data.get('csv_file')
        try:
            for row in csv_file:
                password = generate_random_password()
                username = f"{row['firstName'].lower()}_{row['lastName'].lower()}"[:150]
                user_data = {
                    'username': username,
                    'email': row['email'],
                    'first_name': row['firstName'],
                    'last_name': row['lastName'],
                    'password': password
                }
                serializer = CustomUserSerializer(data=user_data)
                if serializer.is_valid():
                    serializer.save()
                else:
                    print(serializer)
                    continue
            return Response({'message': 'CSV processed successfully'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

from rest_framework import viewsets
from rest_framework.decorators import action
# from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
# from django.shortcuts import get_object_or_404
from .models import Course, CourseContent, ContentType
from .serializers import (
    CourseSerializer, CourseCreateSerializer, 
    CourseContentSerializer, CourseContentCreateSerializer
)
from .models import Course, Subscription
from .serializers import CourseWithSubscribersSerializer, SubscriptionSerializer
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for testing
    
    def get_serializer_class(self):
       if self.action in ['create', 'update', 'partial_update']:
           return CourseCreateSerializer  # Use minimal serializer for write operations
       return CourseSerializer  # Use full serializer for read operations

    
    def get_queryset(self):
        if self.action == 'my_courses':
            return Course.objects.filter(creator=self.request.user)
        return Course.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
    @action(detail=True, methods=['patch'])
    def update_course_image(self, request, pk=None):
        course = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Image file is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course.image = request.FILES['image']
        course.save()
        
        return Response(CourseSerializer(course).data)
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        courses = Course.objects.filter(creator=request.user)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        course = self.get_object()
        contents = course.contents.all().order_by('order')
        serializer = CourseContentSerializer(contents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_content(self, request, pk=None):
        course = self.get_object()
        
        # Add course to request data
        request.data['course'] = course.id
        
        serializer = CourseContentCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_video_content(self, request, pk=None):
        course = self.get_object()
        
        # Get or create Video content type
        content_type, _ = ContentType.objects.get_or_create(name='Video')
        
        data = {
            'course': course.id,
            'content_type': content_type.id,
            'title': request.data.get('title', 'Video Content'),
            'caption': request.data.get('caption', ''),
            'order': request.data.get('order', 0),
            'video_file': request.data.get('video_file')
        }
        
        serializer = CourseContentCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_pdf_content(self, request, pk=None):
        course = self.get_object()
        
        # Get or create PDF content type
        content_type, _ = ContentType.objects.get_or_create(name='PDF')
        
        data = {
            'course': course.id,
            'content_type': content_type.id,
            'title': request.data.get('title', 'PDF Content'),
            'caption': request.data.get('caption', ''),
            'order': request.data.get('order', 0),
            'pdf_file': request.data.get('pdf_file')
        }
        
        serializer = CourseContentCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_qcm_content(self, request, pk=None):
        course = self.get_object()
        
        # Get or create QCM content type
        content_type, _ = ContentType.objects.get_or_create(name='QCM')
        
        data = {
            'course': course.id,
            'content_type': content_type.id,
            'title': request.data.get('title', 'Quiz'),
            'caption': request.data.get('caption', ''),
            'order': request.data.get('order', 0),
            'qcm_question': request.data.get('question'),
            'qcm_options': request.data.get('options', [])
        }
        
        serializer = CourseContentCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_course_image(self, request, pk=None):
        course = self.get_object()
        
        if 'image' not in request.data:
            return Response(
                {'error': 'Image file is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course.image = request.data['image']
        course.save()
        
        return Response(CourseSerializer(course).data)
    @action(detail=True, methods=['get'])
    def subscribers(self, request, pk=None):
        """Get list of all subscribers for a course"""
        course = self.get_object()
        subscriptions = course.course_subscriptions.filter(is_active=True)
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def subscribe(self, request, pk=None):
        """Subscribe current user to course"""
        course = self.get_object()
        user = request.user
        
        # Check if already subscribed
        subscription, created = Subscription.objects.get_or_create(
            user=user,
            course=course,
            defaults={'is_active': True}
        )
        
        if not created:
            subscription.is_active = True
            subscription.save()
        
        return Response(
            {'message': 'Subscribed successfully', 'subscription_id': subscription.id},
            status=status.HTTP_201_CREATED
        )
    
    # In views.py, check the unsubscribe action:

    @action(detail=True, methods=['post'])
    def unsubscribe(self, request, pk=None):
        """Unsubscribe current user from course"""
        course = self.get_object()
        user = request.user
        
        try:
            subscription = Subscription.objects.get(user=user, course=course)
            # If using is_active flag:
            subscription.is_active = False  # This sets the flag but doesn't delete
            subscription.save()
            
            # OR if you want to actually delete:
            # subscription.delete()  # Uncomment this if you want to remove completely
            
            return Response({'message': 'Unsubscribed successfully'})
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'You are not subscribed to this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def is_subscribed(self, request, pk=None):
        """Check if current user is subscribed to course"""
        course = self.get_object()
        user = request.user
        
        is_subscribed = Subscription.objects.filter(
            user=user, 
            course=course, 
            is_active=True
        ).exists()
        
        return Response({'is_subscribed': is_subscribed})
    
    @action(detail=False, methods=['get'])
    def my_subscriptions(self, request):
        """Get all courses the current user is subscribed to"""
        user = request.user
        subscriptions = Subscription.objects.filter(user=user, is_active=True)
        courses = [sub.course for sub in subscriptions]
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['get'])
    def subscription_stats(self, request, pk=None):
        """Get subscription statistics for course"""
        course = self.get_object()
        total = course.course_subscriptions.count()
        active = course.course_subscriptions.filter(is_active=True).count()

        return Response({
            'total_subscriptions': total,
            'active_subscriptions': active,
            'inactive_subscriptions': total - active
        })
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update user's progress in a course"""
        course = self.get_object()
        user = request.user
        
        try:
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            
            # Update progress based on request data
            score = request.data.get('score')
            level = request.data.get('level')
            progress = request.data.get('progress_percentage')
            
            if score is not None:
                subscription.score = score
            if level is not None:
                subscription.level = level
            if progress is not None:
                subscription.progress_percentage = min(100.0, max(0.0, float(progress)))
            
            subscription.save()
            
            return Response(SubscriptionWithProgressSerializer(subscription).data)
            
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'You are not subscribed to this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_content_completed(self, request, pk=None):
        """Mark a course content as completed by the user"""
        course = self.get_object()
        user = request.user
        content_id = request.data.get('content_id')
        
        try:
            content = CourseContent.objects.get(id=content_id, course=course)
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            
            # Add content to completed contents
            subscription.completed_contents.add(content)
            
            # Update progress percentage (simple calculation)
            total_contents = course.contents.count()
            completed_count = subscription.completed_contents.count()
            if total_contents > 0:
                subscription.progress_percentage = (completed_count / total_contents) * 100
            
            subscription.save()
            
            return Response({
                'message': 'Content marked as completed',
                'progress': subscription.progress_percentage
            })
            
        except (CourseContent.DoesNotExist, Subscription.DoesNotExist):
            return Response(
                {'error': 'Content or subscription not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Get course leaderboard sorted by score"""
        course = self.get_object()
        
        # Get top subscribers by score
        leaderboard = course.course_subscriptions.filter(
            is_active=True
        ).order_by('-score', '-progress_percentage')[:10]  # Top 10
        
        serializer = SubscriptionWithProgressSerializer(leaderboard, many=True)
        
        return Response({
            'course': course.title_of_course,
            'leaderboard': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def my_progress(self, request, pk=None):
        """Get current user's progress in the course"""
        course = self.get_object()
        user = request.user
        
        try:
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            serializer = SubscriptionWithProgressSerializer(subscription)
            return Response(serializer.data)
            
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'You are not subscribed to this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    @action(detail=True, methods=['post'])
    def submit_qcm(self, request, pk=None):
        """Submit QCM answers and calculate score"""
        course = self.get_object()
        user = request.user
        content_id = request.data.get('content_id')
        selected_option_ids = request.data.get('selected_options', [])
        time_taken = request.data.get('time_taken', 0)
        
        try:
            # Get content and QCM
            content = CourseContent.objects.get(id=content_id, course=course)
            if content.content_type.name != 'QCM':
                return Response({'error': 'Content is not a QCM'}, status=400)
            
            qcm = content.qcm
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            
            # Check if user can attempt
            completion, created = QCMCompletion.objects.get_or_create(
                subscription=subscription,
                qcm=qcm
            )
            
            if completion.attempts_count >= qcm.max_attempts:
                return Response({'error': 'Maximum attempts reached'}, status=400)
            
            # Create new attempt
            attempt_number = completion.attempts_count + 1
            attempt = QCMAttempt.objects.create(
                user=user,
                qcm=qcm,
                attempt_number=attempt_number,
                time_taken=time_taken
            )
            
            # Add selected options
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
            
            return Response({
                'score': attempt.score,
                'points_earned': attempt.points_earned,
                'is_passed': attempt.is_passed,
                'attempt_number': attempt_number,
                'total_attempts': qcm.max_attempts,
                'remaining_attempts': qcm.max_attempts - attempt_number,
                'total_score': subscription.total_score
            })
            
        except (CourseContent.DoesNotExist, Subscription.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)
    
    @action(detail=True, methods=['get'])
    def qcm_progress(self, request, pk=None):
        """Get user's QCM progress for this course"""
        course = self.get_object()
        user = request.user
        
        try:
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            completions = QCMCompletion.objects.filter(
                subscription=subscription,
                qcm__course_content__course=course
            )
            
            serializer = QCMCompletionSerializer(completions, many=True)
            
            # Calculate totals
            total_qcms = QCM.objects.filter(course_content__course=course).count()
            passed_qcms = completions.filter(is_passed=True).count()
            total_points = subscription.total_score
            max_points = sum(qcm.points for qcm in QCM.objects.filter(course_content__course=course))
            
            return Response({
                'completions': serializer.data,
                'summary': {
                    'total_qcms': total_qcms,
                    'passed_qcms': passed_qcms,
                    'completion_rate': (passed_qcms / total_qcms * 100) if total_qcms > 0 else 0,
                    'total_points': total_points,
                    'max_points': max_points,
                    'points_percentage': (total_points / max_points * 100) if max_points > 0 else 0
                }
            })
            
        except Subscription.DoesNotExist:
            return Response({'error': 'Not subscribed'}, status=400)
    
    @action(detail=True, methods=['get'])
    def check_content_access(self, request, pk=None):
        """Check if user can access specific content"""
        course = self.get_object()
        user = request.user
        content_id = request.query_params.get('content_id')
        
        try:
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            content = CourseContent.objects.get(id=content_id, course=course)
            
            can_access = subscription.can_access_content(content)
            is_locked = not can_access
            
            return Response({
                'can_access': can_access,
                'is_locked': is_locked,
                'content_id': content_id,
                'content_title': content.title
            })
            
        except (Subscription.DoesNotExist, CourseContent.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)