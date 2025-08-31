
# Create your views here.
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import SubscriptionWithProgressSerializer  # Fixed import
import logging
import jwt
from django.contrib.auth.hashers import make_password
from django.utils.crypto import get_random_string
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes 
from django.utils import timezone

logger = logging.getLogger(__name__)


def is_secure_request(request):
    """Check if the request is secure (HTTPS)"""
    return (
        request.is_secure() or
        request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' or
        settings.USE_SSL or
        settings.PRODUCTION
    )
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

# backend/your_app/views.py
from rest_framework.decorators import api_view

from django.db import connection
from redis import Redis


import os
from redis import Redis
import redis

class HealthCheckView(APIView):
    """
    Simple health check that doesn't require authentication
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        health_status = {
            'status': 'healthy',
            'timestamp': str(timezone.now()),
            'version': '1.0.0',
            'service': 'course-app-backend',
            'ssl_enabled': is_secure_request(request)
        }
        
        # Test database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            health_status['database'] = 'connected'
        except Exception as e:
            health_status['database'] = f'error: {str(e)}'
            health_status['status'] = 'degraded'
        
        # Test Redis connection (optional)
        try:
            # Use environment variable or default to 'redis' (Docker service name)
            redis_host = os.environ.get('REDIS_HOST', 'redis')
            redis_port = int(os.environ.get('REDIS_PORT', 6379))
            redis_password = os.environ.get('REDIS_PASSWORD', '')
            
            # Connect to Redis
            if redis_password:
                r = Redis(
                    host=redis_host, 
                    port=redis_port, 
                    password=redis_password,
                    socket_timeout=2
                )
            else:
                r = Redis(
                    host=redis_host, 
                    port=redis_port, 
                    socket_timeout=2
                )
                
            r.ping()
            health_status['redis'] = 'connected'
        except Exception as e:
            health_status['redis'] = f'error: {str(e)}'
            # Don't mark as degraded since Redis is optional for basic functionality
        
        return Response(health_status, status=status.HTTP_200_OK)

# Simple function-based view alternative
@api_view(['GET'])
@permission_classes([AllowAny])
def simple_health_check(request):
    """
    Very simple health check endpoint
    """
    return Response({
        'status': 'healthy',
        'message': 'Service is running',
        'timestamp': str(timezone.now()),
        'ssl_enabled': is_secure_request(request)
    }, status=status.HTTP_200_OK)






from django.contrib.auth import get_user_model
import json

from rest_framework.permissions import AllowAny  
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]
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
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            print(refresh)
            print(access_token)
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
            # First check cookie
            token = request.COOKIES.get('accessToken')
            
            # If no cookie, check Authorization header
            if not token:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                return Response({
                    'authenticated': False, 
                    'debug': 'authenticated1', 
                    'message': 'No token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Decode and verify token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
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
            # ... error handling
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

from django.template.loader import render_to_string
from django.core.mail import EmailMessage
def generate_random_password():
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(12))

import os
from dotenv import load_dotenv
class RegisterwithoutFileView(APIView):
    def post(self, request):
        load_dotenv()
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
            print('bbbdbbdbdbbdbdb')
            print(password)
            print('nncnnfnfnnfn')
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
                sender_email = os.environ.get('EMAIL_HOST_USER')
                login_link = "http://localhost:3000/signup"
                html_message = render_to_string('register.html', {
                    'user': user,
                    'password': password,
                    'login_link':login_link
                })
                msg = EmailMessage('Password', html_message, sender_email, [user.email])
                msg.content_subtype = "html"
                msg.send()
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
# 
from rest_framework.permissions import IsAuthenticated
# 
from .models import Course, CourseContent, ContentType
from .serializers import (
    CourseSerializer, CourseCreateSerializer, 
    CourseContentSerializer
)
from .models import Course, Subscription
from .serializers import CourseWithSubscribersSerializer, SubscriptionSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.decorators import api_view, action


from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import AnonymousUser

from .models import Course, Subscription, CourseContent, QCM, QCMCompletion, QCMAttempt
from .serializers import (
    CourseSerializer, CourseCreateSerializer, CourseContentSerializer, 
    SubscriptionSerializer,
    SubscriptionWithProgressSerializer, QCMCompletionSerializer
)

# Course List and Detail Views

from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
class CourseList(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print('Received course creation request')
        print(f"User: {request.user}")
        print(f"Authenticated: {request.user.is_authenticated}")
        print(f"Request data keys: {list(request.data.keys())}")
        print(f"Request FILES keys: {list(request.FILES.keys())}")
        
        # Handle both form data and JSON
        data = request.data.copy()
        
        # Handle file upload
        if 'image' in request.FILES:
            data['image'] = request.FILES['image']
            print("Image file found in request")
        else:
            print("No image file found in request")
        
        # Pass request context to serializer
        serializer = CourseCreateSerializer(
            data=data, 
            context={'request': request}  # This is crucial!
        )
        
        if serializer.is_valid():
            print("Serializer is valid")
            print(f"Validated data: {serializer.validated_data}")
            
            try:
                course = serializer.save()
                print(f"Course created successfully with ID: {course.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error saving course: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response(
                    {'error': f'Failed to save course: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseDetail(APIView):
    permission_classes = [AllowAny]
    
    def get_object(self, pk):
        return get_object_or_404(Course, pk=pk)
    
    def get(self, request, pk):
        course = self.get_object(pk)
        serializer = CourseSerializer(course)
        return Response(serializer.data)
    
    def put(self, request, pk):
        course = self.get_object(pk)
        serializer = CourseCreateSerializer(course, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        course = self.get_object(pk)
        serializer = CourseCreateSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        course = self.get_object(pk)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# My Courses View

# views.py
class MyCourses(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)
        
        courses = Course.objects.filter(creator=request.user)
        # Add context={'request': request} to include request in serializer
        serializer = CourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)
# Course Image Update View

class CourseImageUpdate(APIView):
    def patch(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Image file is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course.image = request.FILES['image']
        course.save()
        
        return Response(CourseSerializer(course).data)

# Course Contents Views

# views.py
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated



from .models import Course, CourseContent, ContentType, QCM, QCMOption, VideoContent, PDFContent
from .serializers import (
    CourseContentSerializer,
    QCMOptionCreateSerializer, QCMCreateSerializer
)

class CourseContentsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request, pk):
        """Get all contents for a course"""
        course = get_object_or_404(Course, pk=pk)
        contents = course.contents.all().order_by('order')
        serializer = CourseContentSerializer(contents, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk):
        """Create new course content"""
        course = get_object_or_404(Course, pk=pk)
        
        # Check if user is the course creator
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data.copy()
        data['course'] = course.id
        
        # Get content type
        content_type_name = data.get('content_type')
        if content_type_name:
            content_type = get_object_or_404(ContentType, name=content_type_name)
            data['content_type'] = content_type.id
        
        serializer = CourseContentCreateSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            try:
                content = serializer.save()
                return Response(
                    CourseContentSerializer(content).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response(
                    {'error': f'Failed to create content: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CourseContentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self, course_pk, content_pk):
        course = get_object_or_404(Course, pk=course_pk)
        return get_object_or_404(CourseContent, pk=content_pk, course=course)
    
    def get(self, request, course_pk, content_pk):
        """Get specific content"""
        content = self.get_object(course_pk, content_pk)
        serializer = CourseContentSerializer(content)
        return Response(serializer.data)
    
    def put(self, request, course_pk, content_pk):
        """Update content"""
        content = self.get_object(course_pk, content_pk)
        
        # Check permission
        if content.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CourseContentCreateSerializer(content, data=request.data, partial=True)
        
        if serializer.is_valid():
            content = serializer.save()
            return Response(CourseContentSerializer(content).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, course_pk, content_pk):
        """Delete content"""
        content = self.get_object(course_pk, content_pk)
        
        # Check permission
        if content.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
# views.py - Fix the CreatePDFContentView
# views.py
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.parsers import MultiPartParser, JSONParser
from .serializers import (
    PDFContentCreateSerializer, 
    VideoContentCreateSerializer, 
    QCMContentCreateSerializer,
    CourseContentSerializer
)
# In your views.py
# class CreatePDFContentView(APIView):
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser]
    
#     def post(self, request, pk):
#         """Create PDF content"""
#         course = get_object_or_404(Course, pk=pk)
        
#         if course.creator != request.user:
#             return Response(
#                 {'error': 'You are not the creator of this course'},
#                 status=status.HTTP_403_FORBIDDEN
#             )
        
#         # Get PDF content type
#         content_type = get_object_or_404(ContentType, name='PDF')
        
#         # Use the specific PDF serializer
#         serializer = PDFContentCreateSerializer(
#             data=request.data, 
#             context={
#                 'request': request,
#                 'course': course,
#                 'content_type': content_type
#             }
#         )
        
#         if serializer.is_valid():
#             content = serializer.save()
#             return Response(
#                 CourseContentSerializer(content).data,
#                 status=status.HTTP_201_CREATED
#             )
        
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated



from .models import Course, ContentType
from .serializers import (
    PDFContentCreateSerializer, 
    VideoContentCreateSerializer, 
    QCMContentCreateSerializer,
    CourseContentSerializer
)

class CreatePDFContentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    def post(self, request, pk):
        """Create PDF content"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get PDF content type
        content_type = get_object_or_404(ContentType, name='PDF')
        
        serializer = PDFContentCreateSerializer(
            data=request.data, 
            context={
                'request': request,
                'course': course,
                'content_type': content_type
            }
        )
        
        if serializer.is_valid():
            content = serializer.save()
            return Response(
                CourseContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateVideoContentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    def post(self, request, pk):
        """Create Video content"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get Video content type
        content_type = get_object_or_404(ContentType, name='Video')
        
        serializer = VideoContentCreateSerializer(
            data=request.data, 
            context={
                'request': request,
                'course': course,
                'content_type': content_type
            }
        )
        
        if serializer.is_valid():
            content = serializer.save()
            return Response(
                CourseContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateQCMContentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def post(self, request, pk):
        """Create QCM quiz content"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get QCM content type
        content_type = get_object_or_404(ContentType, name='QCM')
        
        serializer = QCMContentCreateSerializer(
            data=request.data, 
            context={
                'request': request,
                'course': course,
                'content_type': content_type
            }
        )
        
        if serializer.is_valid():
            content = serializer.save()
            return Response(
                CourseContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# Subscription Views

class CourseSubscribers(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        subscriptions = course.course_subscriptions.filter(is_active=True)
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)


class SubscribeToCourse(APIView):
    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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


class UnsubscribeFromCourse(APIView):
    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        user = request.user
        
        try:
            subscription = Subscription.objects.get(user=user, course=course)
            subscription.is_active = False
            subscription.save()
            
            return Response({'message': 'Unsubscribed successfully'})
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'You are not subscribed to this course'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CheckSubscription(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        user = request.user
        
        is_subscribed = Subscription.objects.filter(
            user=user, 
            course=course, 
            is_active=True
        ).exists()
        
        return Response({'is_subscribed': is_subscribed})


class MySubscriptions(APIView):
    def get(self, request):
        user = request.user
        subscriptions = Subscription.objects.filter(user=user, is_active=True)
        courses = [sub.course for sub in subscriptions]
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)


class SubscriptionStats(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        total = course.course_subscriptions.count()
        active = course.course_subscriptions.filter(is_active=True).count()

        return Response({
            'total_subscriptions': total,
            'active_subscriptions': active,
            'inactive_subscriptions': total - active
        })

# Progress Tracking Views

class UpdateProgress(APIView):
    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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


class MarkContentCompleted(APIView):
    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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


class CourseLeaderboard(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        
        # Get top subscribers by score
        leaderboard = course.course_subscriptions.filter(
            is_active=True
        ).order_by('-score', '-progress_percentage')[:10]  # Top 10
        
        serializer = SubscriptionWithProgressSerializer(leaderboard, many=True)
        
        return Response({
            'course': course.title_of_course,
            'leaderboard': serializer.data
        })


class MyProgress(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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

# QCM Views

class SubmitQCM(APIView):
    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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


class QCMProgress(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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


class CheckContentAccess(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
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




# views.py
from django.db.models import Count, Avg, Q, F



from .models import Course, Subscription, QCMCompletion

class CourseStatisticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get comprehensive statistics for a course"""
        course = get_object_or_404(Course, pk=pk)
        
        # Check if user is the course creator
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get subscription statistics
        total_subscriptions = course.course_subscriptions.count()
        active_subscriptions = course.course_subscriptions.filter(is_active=True).count()
        inactive_subscriptions = total_subscriptions - active_subscriptions
        
        # Get progress statistics
        progress_stats = course.course_subscriptions.filter(is_active=True).aggregate(
            avg_progress=Avg('progress_percentage'),
            max_progress=Avg('progress_percentage'),
            min_progress=Avg('progress_percentage')
        )
        
        # Get score statistics
        score_stats = course.course_subscriptions.filter(is_active=True).aggregate(
            avg_score=Avg('total_score'),
            max_score=Avg('total_score'),
            min_score=Avg('total_score')
        )
        
        # Get completion statistics
        completed_count = course.course_subscriptions.filter(
            is_active=True, 
            progress_percentage=100
        ).count()
        
        # Get QCM completion statistics
        qcm_stats = QCMCompletion.objects.filter(
            subscription__course=course,
            subscription__is_active=True
        ).aggregate(
            avg_attempts=Avg('attempts_count'),
            avg_score=Avg('best_score'),
            pass_rate=Avg('is_passed', output_field=models.FloatField()) * 100
        )
        
        # Get recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.now() - timedelta(days=7)
        recent_activity = course.course_subscriptions.filter(
            is_active=True,
            last_activity__gte=week_ago
        ).count()
        
        # Get enrollment trend (monthly)
        from django.db.models.functions import TruncMonth
        enrollment_trend = course.course_subscriptions.annotate(
            month=TruncMonth('subscribed_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        return Response({
            'course': {
                'id': course.id,
                'title': course.title_of_course,
                'creator': course.creator.get_full_name(),
                'created_at': course.created_at
            },
            'subscriptions': {
                'total': total_subscriptions,
                'active': active_subscriptions,
                'inactive': inactive_subscriptions,
                'completion_rate': (completed_count / active_subscriptions * 100) if active_subscriptions > 0 else 0
            },
            'progress': {
                'average': progress_stats['avg_progress'] or 0,
                'maximum': progress_stats['max_progress'] or 0,
                'minimum': progress_stats['min_progress'] or 0,
                'completed': completed_count
            },
            'scores': {
                'average': score_stats['avg_score'] or 0,
                'maximum': score_stats['max_score'] or 0,
                'minimum': score_stats['min_score'] or 0
            },
            'qcm_performance': {
                'average_attempts': qcm_stats['avg_attempts'] or 0,
                'average_score': qcm_stats['avg_score'] or 0,
                'pass_rate': qcm_stats['pass_rate'] or 0
            },
            'activity': {
                'recent_activity': recent_activity,
                'enrollment_trend': list(enrollment_trend)
            }
        })

class CourseSubscribersListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get detailed list of subscribers with their progress"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        subscribers = course.course_subscriptions.filter(is_active=True).select_related('user')
        
        # Pagination
        page = self.paginate_queryset(subscribers)
        if page is not None:
            serializer = SubscriptionWithProgressSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = SubscriptionWithProgressSerializer(subscribers, many=True)
        return Response(serializer.data)

class CourseProgressOverviewView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get overview of course progress for all subscribers"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get progress distribution
        progress_distribution = {
            '0-20%': course.course_subscriptions.filter(
                is_active=True, 
                progress_percentage__range=(0, 20)
            ).count(),
            '21-40%': course.course_subscriptions.filter(
                is_active=True, 
                progress_percentage__range=(21, 40)
            ).count(),
            '41-60%': course.course_subscriptions.filter(
                is_active=True, 
                progress_percentage__range=(41, 60)
            ).count(),
            '61-80%': course.course_subscriptions.filter(
                is_active=True, 
                progress_percentage__range=(61, 80)
            ).count(),
            '81-99%': course.course_subscriptions.filter(
                is_active=True, 
                progress_percentage__range=(81, 99)
            ).count(),
            '100%': course.course_subscriptions.filter(
                is_active=True, 
                progress_percentage=100
            ).count()
        }
        
        # Get average time to complete
        completed_subscriptions = course.course_subscriptions.filter(
            is_active=True, 
            progress_percentage=100
        )
        
        avg_completion_time = completed_subscriptions.aggregate(
            avg_time=Avg(F('last_activity') - F('subscribed_at'))
        )['avg_time']
        
        return Response({
            'progress_distribution': progress_distribution,
            'average_completion_time': avg_completion_time.total_seconds() / 86400 if avg_completion_time else 0,  # Convert to days
            'total_learners': course.course_subscriptions.filter(is_active=True).count(),
            'active_this_week': course.course_subscriptions.filter(
                is_active=True,
                last_activity__gte=datetime.now() - timedelta(days=7)
            ).count()
        })

class QCMPerformanceView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get QCM performance statistics for the course"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all QCMs in this course
        qcms = QCM.objects.filter(course_content__course=course)
        
        qcm_performance = []
        for qcm in qcms:
            completions = QCMCompletion.objects.filter(qcm=qcm)
            
            stats = completions.aggregate(
                total_attempts=Count('id'),
                avg_score=Avg('best_score'),
                pass_rate=Avg('is_passed', output_field=models.FloatField()) * 100,
                avg_attempts=Avg('attempts_count')
            )
            
            qcm_performance.append({
                'qcm_id': qcm.id,
                'question': qcm.question,
                'total_attempts': stats['total_attempts'] or 0,
                'average_score': stats['avg_score'] or 0,
                'pass_rate': stats['pass_rate'] or 0,
                'average_attempts': stats['avg_attempts'] or 0,
                'difficulty': 'Easy' if (stats['avg_score'] or 0) >= 80 else 
                             'Medium' if (stats['avg_score'] or 0) >= 60 else 'Hard'
            })
        
        return Response({
            'total_qcms': qcms.count(),
            'qcm_performance': qcm_performance,
            'overall_pass_rate': sum(item['pass_rate'] for item in qcm_performance) / len(qcm_performance) if qcm_performance else 0
        })

class EnrollmentTrendView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get enrollment trends over time"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Monthly enrollment trend
        monthly_trend = course.course_subscriptions.annotate(
            month=TruncMonth('subscribed_at')
        ).values('month').annotate(
            enrollments=Count('id'),
            active_enrollments=Count('id', filter=Q(is_active=True))
        ).order_by('month')
        
        # Weekly activity trend
        from django.db.models.functions import TruncWeek
        weekly_activity = course.course_subscriptions.filter(
            is_active=True
        ).annotate(
            week=TruncWeek('last_activity')
        ).values('week').annotate(
            active_users=Count('id', distinct=True)
        ).order_by('week')[:12]  # Last 12 weeks
        
        return Response({
            'monthly_enrollment': list(monthly_trend),
            'weekly_activity': list(weekly_activity),
            'total_enrollments': course.course_subscriptions.count(),
            'current_active': course.course_subscriptions.filter(is_active=True).count()
        })

# admin_dashboard/views.py (continued)



from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q, F, ExpressionWrapper, FloatField
from django.utils import timezone
from datetime import timedelta, datetime

from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.db.models.functions import Cast
import json
from collections import defaultdict

class IsSuperUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) or request.user.Privilege == 'A'

from django.db.models import Avg, Value
from django.db.models.functions import Coalesce

class AdminDashboardView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        # Get statistics
        total_users = CustomUser.objects.count()
        total_courses = Course.objects.count()
        total_subscriptions = Subscription.objects.filter(is_active=True).count()
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_users = CustomUser.objects.filter(date_joined__gte=week_ago).count()
        recent_courses = Course.objects.filter(created_at__gte=week_ago).count()
        # User distribution by privilege
        user_distribution = CustomUser.objects.values('Privilege').annotate(
            count=Count('id')
        )
        # Daily user registration chart data
        user_registration_data = self.get_user_registration_chart_data()

        # Course statistics
        course_stats = self.get_course_statistics()
        return Response({
            'overview': {
                'total_users': total_users,
                'total_courses': total_courses,
                'active_subscriptions': total_subscriptions,
                'recent_users': recent_users,
                'recent_courses': recent_courses,
            },
            'user_distribution': list(user_distribution),
            'user_registration_chart': user_registration_data,
            'course_statistics': course_stats,
            'timestamp': timezone.now()
        })
    
    def get_user_registration_chart_data(self):
        # Last 30 days user registration data
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        registration_data = (
            CustomUser.objects
            .filter(date_joined__gte=thirty_days_ago)
            .annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        return {
            'labels': [item['date'].strftime('%Y-%m-%d') for item in registration_data],
            'data': [item['count'] for item in registration_data]
        }
    
    def get_course_statistics(self):
        courses = Course.objects.all()
        course_data = []
        for course in courses:
            subscriptions = course.course_subscriptions.filter(is_active=True)
            total_subscribers = subscriptions.count()
            if total_subscribers > 0:
                completed_count = subscriptions.filter(progress_percentage=100).count()
            else:
                completed_count = 0
            completion_rate = round((completed_count / total_subscribers * 100) if total_subscribers > 0 else 0.2)
            try:
                # Try to get the average score
                result = subscriptions.aggregate(avg=Avg('total_score'))
                avg_value = result['avg']

                # Handle None case
                if avg_value is None:
                    average_score = 0.2
                else:
                    average_score = round(avg_value)

                print('average_score------', average_score)

            except Exception as e:
                # Handle any other errors
                print('Error calculating average score:', e)
                average_score = 0.2
                print('average_score------', average_score)
            course_data.append({
                'id': course.id,
                'title': course.title_of_course,
                'creator': course.creator.username,
                'created_at': course.created_at,
                'total_subscribers': total_subscribers,
                'completed_count': completed_count,
                'completion_rate': completion_rate,
                'average_score': average_score
            })
            print("#################################################")
        
        return course_data

class UserManagementView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        users = CustomUser.objects.all().order_by('-date_joined')
        user_data = []
        
        for user in users:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}",
                'privilege': user.get_Privilege_display(),
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_active': user.is_active,
                'course_count': user.created_courses.count(),
                'subscription_count': user.course_subscriptions.filter(is_active=True).count()
            })
        
        # User growth statistics
        user_growth = self.get_user_growth_stats()
        
        return Response({
            'users': user_data,
            'user_growth': user_growth
        })
    
    def get_user_growth_stats(self):
        # Monthly user growth
        monthly_growth = (
            CustomUser.objects
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        return {
            'labels': [item['month'].strftime('%Y-%m') for item in monthly_growth],
            'data': [item['count'] for item in monthly_growth]
        }

class CourseManagementView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        courses = Course.objects.all().select_related('creator').prefetch_related('contents')
        serializer = CourseWithSubscribersSerializer(courses, many=True, context={'request': request})
        
        # Course enrollment statistics
        enrollment_stats = self.get_enrollment_stats()
        
        return Response({
            'courses': serializer.data,
            'enrollment_stats': enrollment_stats
        })
    
    def get_enrollment_stats(self):
        # Course popularity by enrollment count
        popular_courses = (
            Course.objects
            .annotate(enrollment_count=Count('course_subscriptions'))
            .order_by('-enrollment_count')[:10]
            .values('title_of_course', 'enrollment_count')
        )
        
        return {
            'labels': [course['title_of_course'] for course in popular_courses],
            'data': [course['enrollment_count'] for course in popular_courses]
        }
    
from django.db.models import Count, Avg, ExpressionWrapper, FloatField, Case, When, Value

class SystemAnalyticsView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        # Course completion rates
        print('*********************************************')
        course_stats = []
        for course in Course.objects.all():
            subscriptions = course.course_subscriptions.filter(is_active=True)
            print('++++++++++++++++++++++++++++*********************************************')
            total_subscribers = subscriptions.count()
            if total_subscribers > 0:
                completed_count = subscriptions.filter(progress_percentage=100).count()
            else:
                completed_count = 0
            completion_rate = round((completed_count / total_subscribers * 100) if total_subscribers > 0 else 0.2)
            print('22222222222222222222*********************************************')
            try:
                # Try to get the average score
                result = subscriptions.aggregate(avg=Avg('total_score'))
                avg_value = result['avg']
                
                # Handle None case
                if avg_value is None:
                    average_score = 0.2
                else:
                    average_score = round(avg_value)
                    

                
            except Exception as e:
                # Handle any other errors
                print('Error calculating average score:', e)
                average_score = 0.2
            course_stats.append({
                'course_id': course.id,
                'course_title': course.title_of_course,
                'total_subscribers': total_subscribers,
                'completed_count': completed_count,
                'completion_rate': completion_rate,
                'average_score': average_score
            })
        
        # QCM performance
        qcm_stats = QCMCompletion.objects.values('qcm__course_content__course__title_of_course').annotate(
    total_attempts=Count('id'),
    avg_score=Avg('best_score'),
    pass_rate=ExpressionWrapper(
        Avg(
            Case(
                When(is_passed=True, then=Value(1.0)),
                default=Value(0.0),
                output_field=FloatField()
            )
        ) * 100.0,
        output_field=FloatField()
    )
)
        # User engagement
        active_users = CustomUser.objects.filter(
            last_login__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Learning progress distribution
        progress_distribution = self.get_progress_distribution()
        
        # Weekly activity data
        weekly_activity = self.get_weekly_activity()
        print('-sssss--------------------------------------------------------')
        engagement_rate = (active_users / CustomUser.objects.count() * 100) if CustomUser.objects.count() > 0 else 0.2
        print(round(engagement_rate))
        try:
            print(list(qcm_stats))
            print(CustomUser.objects.count())
            print('engagement_rate', engagement_rate)
            return Response({
            'course_statistics': course_stats,
            'qcm_performance': list(qcm_stats),
            'user_engagement': {
                'active_users_30d': active_users,
                'total_users': CustomUser.objects.count(),
                'engagement_rate': round(engagement_rate)
            },
            'progress_distribution': progress_distribution,
            'weekly_activity': weekly_activity
        })
        except Exception as e:
            print(f"Database error: {e}")
            # print('+++++++++++++++++++++++++')
            # count = 0
            # print(count)
            # distribution.append({'range': label, 'count': count})
        # return Response({
        #     'course_statistics': course_stats,
        #     'qcm_performance': list(qcm_stats),
        #     'user_engagement': {
        #         'active_users_30d': active_users,
        #         'total_users': CustomUser.objects.count(),
        #         'engagement_rate': engagement_rate
        #     },
        #     'progress_distribution': progress_distribution,
        #     'weekly_activity': weekly_activity
        # })
    
    def get_progress_distribution(self):
        progress_ranges = [
            ('0-20%', (0, 20)),
            ('21-40%', (21, 40)),
            ('41-60%', (41, 60)),
            ('61-80%', (61, 80)),
            ('81-99%', (81, 99)),
            ('100%', (100, 100))
        ]
        
        distribution = []
        for label, (min_val, max_val) in progress_ranges:
            print('----------------------++++++')
        try:
            count = Subscription.objects.filter(
                is_active=True,
                completed_qcms__gte=min_val,
                completed_qcms__lte=max_val
            ).count()
            print('+++++++++++++++++++++++++')
            print(count)
        except Exception as e:
            print(f"Database error: {e}")
            print('+++++++++++++++++++++++++')
            count = 0
            print(count)
            distribution.append({'range': label, 'count': count})
        
        return distribution
    
    def get_weekly_activity(self):
        # Last 12 weeks of activity
        twelve_weeks_ago = timezone.now() - timedelta(weeks=12)
        try:

            weekly_activity = (
    QCMCompletion.objects  # Query the QCMCompletion model instead
    .filter(last_attempt__gte=twelve_weeks_ago)
    .annotate(week=TruncWeek('last_attempt'))
    .values('week')
    .annotate(active_users=Count('subscription__user', distinct=True))  # Count unique users through subscription
    .order_by('week')
)
            # print(count)
        except Exception as e:
            print(f"Database error: {e}")
            # print('+++++++++++++++++++++++++')
            # count = 0
            # print(count)
            # distribution.append({'range': label, 'count': count})
        
        return {
            'labels': [item['week'].strftime('%Y-%m-%d') for item in weekly_activity],
            'data': [item['active_users'] for item in weekly_activity]
        }

class ContentManagementView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        contents = CourseContent.objects.all().select_related('course', 'content_type')
        print('helloooooooooo')
        content_data = []
        for content in contents:
            try:
            
                content_data.append({
                    'id': content.id,
                    'title': content.title,
                    'course': content.course.title_of_course,
                    'content_type': content.content_type.name,
                    'order': content.order,
                    # 'created_at': content.created_at,
                    'qcm_attempts': getattr(content, 'qcm', None).attempts.count() if hasattr(content, 'qcm') else 0,
                })
            except Exception as e:
                print(f"Database error: {e}")
        print('hellooooooooooooooooo')
        # Content type distribution
        content_type_stats = (
            CourseContent.objects
            .values('content_type__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        print('good by++++')
        
        # Content usage statistics
        content_usage = self.get_content_usage_stats()
        print('na na ana ')
        return Response({
            'contents': content_data,
            'content_type_stats': list(content_type_stats),
            'content_usage': content_usage
        })
    
    def get_content_usage_stats(self):
        # Get most accessed content (by QCM attempts)
        popular_content = (
            CourseContent.objects
            .filter(qcm__isnull=False)
            .annotate(attempts_count=Count('qcm__attempts'))
            .order_by('-attempts_count')[:10]
            .values('title', 'course__title_of_course', 'attempts_count')
        )
        
        return {
            'labels': [f"{item['title']} ({item['course__title_of_course']})" for item in popular_content],
            'data': [item['attempts_count'] for item in popular_content]
        }

class UserDetailView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id)
        
        # User learning statistics
        learning_stats = self.get_user_learning_stats(user)
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'privilege': user.get_Privilege_display(),
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'created_courses': [
                {
                    'id': course.id,
                    'title': course.title_of_course,
                    'created_at': course.created_at,
                    'subscriber_count': course.course_subscriptions.filter(is_active=True).count()
                }
                for course in user.created_courses.all()
            ],
            'subscriptions': [
                {
                    'course_id': sub.course.id,
                    'course_title': sub.course.title_of_course,
                    'subscribed_at': sub.subscribed_at,
                    'progress': sub.progress_percentage,
                    'score': sub.score
                }
                for sub in user.course_subscriptions.filter(is_active=True)
            ],
            'qcm_completions': [
                {
                    'qcm_id': comp.qcm.id,
                    'question': comp.qcm.question,
                    'best_score': comp.best_score,
                    'attempts': comp.attempts_count,
                    'is_passed': comp.is_passed
                }
                for comp in user.qcmcompletion_set.all()
            ],
            'learning_stats': learning_stats
        }
        
        return Response({'user': user_data})
    
    def get_user_learning_stats(self, user):
        # User learning progress over time
        monthly_progress = (
            Subscription.objects
            .filter(user=user, is_active=True)
            .annotate(month=TruncMonth('last_activity'))
            .values('month')
            .annotate(avg_progress=Avg('progress_percentage'))
            .order_by('month')
        )
        
        return {
            'labels': [item['month'].strftime('%Y-%m') for item in monthly_progress],
            'data': [item['avg_progress'] for item in monthly_progress]
        }


class SystemHealthView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        # System performance metrics
        system_metrics = {
            'database_size': self.get_database_size(),
            'active_sessions': self.get_active_sessions(),
            'server_uptime': self.get_server_uptime(),
            'error_rate': self.get_error_rate()
        }
        
        return Response({
            'system_metrics': system_metrics,
            'performance_stats': self.get_performance_stats()
        })
    
    def get_database_size(self):
        # Placeholder for database size calculation
        return "2.5 GB"
    
    def get_active_sessions(self):
        # Get active user sessions
        from django.contrib.sessions.models import Session
        return Session.objects.count()
    
    def get_server_uptime(self):
        # Placeholder for server uptime
        return "15 days, 3 hours"
    
    def get_error_rate(self):
        # Placeholder for error rate calculation
        return "0.2%"
    
    def get_performance_stats(self):
        # API response time statistics
        return {
            'labels': ['Auth', 'Courses', 'Content', 'QCM'],
            'data': [120, 250, 180, 300]  # response times in ms
        }