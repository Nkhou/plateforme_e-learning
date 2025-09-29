# views.py
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser, Course, Module, CourseContent, Subscription, QCM, QCMCompletion, QCMAttempt, QCMOption, VideoContent, PDFContent, ContentType
from .serializers import (
    CustomUserSerializer, CourseSerializer, CourseCreateSerializer, CourseDetailSerializer,
    ModuleSerializer, ModuleCreateSerializer, CourseContentSerializer, CourseContentCreateSerializer,
    SubscriptionSerializer, SubscriptionWithProgressSerializer, QCMAttemptSerializer, 
    QCMCompletionSerializer, PDFContentSerializer, VideoContentSerializer, QCMSerializer,
    QCMOptionCreateSerializer, QCMContentCreateSerializer, PDFContentCreateSerializer,
    VideoContentCreateSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
import logging
import jwt
from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes 
from django.utils import timezone
from django.db import connection
import os
import json
import secrets
import string
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Count, Avg, Q, F, Sum
from django.db.models.functions import TruncMonth, TruncWeek, TruncDate
from datetime import timedelta, datetime
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import action

logger = logging.getLogger(__name__)
User = get_user_model()

# Utility functions
def is_secure_request(request):
    """Check if the request is secure (HTTPS)"""
    return (
        request.is_secure() or
        request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' or
        settings.USE_SSL or
        settings.PRODUCTION
    )

def generate_random_password():
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(12))

# Health Check Views
class HealthCheckView(APIView):
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
        
        return Response(health_status, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def simple_health_check(request):
    return Response({
        'status': 'healthy',
        'message': 'Service is running',
        'timestamp': str(timezone.now()),
        'ssl_enabled': is_secure_request(request)
    }, status=status.HTTP_200_OK)

# Authentication Views
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
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
            
            if not email or not password:
                return Response(
                    {"error": "Email and password are required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {"error": "Invalid credentials."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            user = authenticate(request, username=user_obj.username, password=password)
            if user is None:
                return Response(
                    {"error": "Invalid credentials."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if user.status == 2:
                return Response(
                    {"error": "Votre compte est suspendu. Contactez l'administrateur."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            response = Response({
                'refresh': str(refresh),
                'access': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'privilege': user.privilege
                }
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                key='accessToken',
                value=access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=60 * 60 * 24
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

class CourseStatusManagementView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Changer le statut d'un cours"""
        course = get_object_or_404(Course, pk=pk)
        
        # Vérifier que l'utilisateur est le créateur du cours ou un admin
        if course.creator != request.user and request.user.privilege != 'A':
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à modifier ce cours'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        action = request.data.get('action')  # 'activate', 'archive', 'draft'
        
        if action == 'activate':
            course.status = 1
            course.save()
            return Response({
                'message': f'Cours "{course.title_of_course}" activé avec succès',
                'status': 'active',
                'status_display': 'Actif'
            })
        elif action == 'archive':
            course.status = 2
            course.save()
            return Response({
                'message': f'Cours "{course.title_of_course}" archivé avec succès',
                'status': 'archived',
                'status_display': 'Archivé'
            })
        elif action == 'draft':
            course.status = 0
            course.save()
            return Response({
                'message': f'Cours "{course.title_of_course}" mis en brouillon avec succès',
                'status': 'draft',
                'status_display': 'Brouillon'
            })
        else:
            return Response(
                {'error': 'Action non valide. Utilisez "activate", "archive" ou "draft".'},
                status=status.HTTP_400_BAD_REQUEST
            )
class CheckAuthentificationView(APIView):
    def get(self, request):
        try:
            token = request.COOKIES.get('accessToken')
            
            if not token:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                return Response({
                    'authenticated': False, 
                    'message': 'No token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            UserById_ = CustomUser.objects.filter(id=payload.get('user_id')).first()

            # Vérifier si l'utilisateur est suspendu
            if UserById_ and UserById_.status == 2:  # Suspendu
                return Response({
                    'authenticated': False,
                    'message': 'Votre compte est suspendu'
                }, status=status.HTTP_403_FORBIDDEN)

            user = {
                "user_id": payload.get('user_id'),
                "username": UserById_.username,
                "firstname": UserById_.first_name,
                "lastName": UserById_.last_name,
                "email": UserById_.email,
                "privilege": UserById_.privilege,
                "department": UserById_.department,
                "department_display": UserById_.get_department_display(),
                "status": UserById_.status,
                "status_display": "Actif" if UserById_.status == 1 else "Suspendu"
            }
            
            return Response({
                'authenticated': True, 
                'user': user
            }, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            request.delete_cookie('accessToken')
            return Response({
                'authenticated': False, 
                'message': 'Token expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({
                'authenticated': False, 
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

# User Management Views
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

    # REMPLACER la méthode delete par patch pour changer le statut
    def patch(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        action = request.data.get('action')  # 'suspend' ou 'activate'
        
        if action == 'suspend':
            user.status = 2  # Suspendu
            user.save()
            return Response({
                'message': f'Utilisateur {user.username} suspendu avec succès',
                'status': 'suspended'
            })
        elif action == 'activate':
            user.status = 1  # Actif
            user.save()
            return Response({
                'message': f'Utilisateur {user.username} activé avec succès',
                'status': 'active'
            })
        else:
            return Response(
                {'error': 'Action non valide. Utilisez "suspend" ou "activate".'},
                status=status.HTTP_400_BAD_REQUEST
            )
# Add this to your user/views.py
from rest_framework.parsers import MultiPartParser
import csv
from io import TextIOWrapper

class CSVUploadView(APIView):
    parser_classes = [MultiPartParser]
    
    def post(self, request):
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No CSV file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Read the CSV file
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            reader = csv.DictReader(decoded_file)
            
            created_users = []
            errors = []
            
            for row_num, row in enumerate(reader, start=2):  # start=2 because header is row 1
                try:
                    password = generate_random_password()
                    username = f"{row['first_name'].lower()}_{row['last_name'].lower()}"[:150]
                    username = ''.join(c for c in username if c.isalnum() or c in '._-')
                    
                    user_data = {
                        'username': username,
                        'email': row['email'],
                        'first_name': row['first_name'],
                        'last_name': row['last_name'],
                        'department': row.get('department', 'F'),
                        'password': password
                    }
                    
                    serializer = CustomUserSerializer(data=user_data)
                    if serializer.is_valid():
                        user = serializer.save()
                        created_users.append({
                            'username': user.username,
                            'email': user.email,
                            'name': f"{user.first_name} {user.last_name}"
                        })
                    else:
                        errors.append({
                            'row': row_num,
                            'errors': serializer.errors,
                            'data': row
                        })
                        
                except Exception as e:
                    errors.append({
                        'row': row_num,
                        'error': str(e),
                        'data': row
                    })
            
            response_data = {
                'message': f'Processed {len(created_users) + len(errors)} rows',
                'created_users': created_users,
                'errors': errors
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f'Failed to process CSV: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class RegisterwithoutFileView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            first_name = request.data.get('firstName', '').strip()
            last_name = request.data.get('lastName', '').strip()
            privilege = request.data.get('privilege', 'AP').strip().upper()
            department = request.data.get('department', 'F').strip().upper()
            
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
                'privilege': privilege,
                'department': department,
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
                    'login_link': login_link
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

# Course Views
class CourseList(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Filtrer les cours selon le statut et le privilège de l'utilisateur
        user = request.user
        
        # Par défaut, montrer seulement les cours actifs
        base_query = Q(status=1)  # Cours actifs
        
        if user.is_authenticated:
            if user.privilege in ['F', 'A']:  # Formateurs et Admins voient plus
                base_query = Q(status__in=[0, 1])  # Brouillon + Actif
            # Les apprenants (AP) voient seulement les cours actifs
        
        courses = Course.objects.filter(base_query).select_related('creator')
        serializer = CourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        data = request.data.copy()
        
        if 'image' in request.FILES:
            data['image'] = request.FILES['image']
        
        if 'department' not in data:
            data['department'] = 'F'
        
        # Les nouveaux cours sont créés en brouillon par défaut
        if 'status' not in data:
            data['status'] = 0  # Brouillon
        
        serializer = CourseCreateSerializer(
            data=data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                course = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response(
                    {'error': f'Failed to save course: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class CourseDetail(APIView):
    permission_classes = [AllowAny]
    
    def get_object(self, pk):
        return get_object_or_404(Course, pk=pk)
    
    def get(self, request, pk):
        course = self.get_object(pk)
        
        # Vérifier si l'utilisateur peut voir le cours
        user = request.user
        if course.status == 0 and not (user.is_authenticated and 
                                      (user.privilege in ['F', 'A'] or user == course.creator)):
            return Response(
                {'error': 'Ce cours est en brouillon et non accessible'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CourseDetailSerializer(course, context={'request': request})
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
        
        # Vérifier les permissions
        if course.creator != request.user and request.user.privilege != 'A':
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à modifier ce cours'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        action = request.data.get('action')
        
        if action == 'activate':
            course.status = 1
            course.save()
            return Response({
                'message': 'Cours activé avec succès',
                'status': 'active'
            })
        elif action == 'archive':
            course.status = 2
            course.save()
            return Response({
                'message': 'Cours archivé avec succès',
                'status': 'archived'
            })
        elif action == 'draft':
            course.status = 0
            course.save()
            return Response({
                'message': 'Cours remis en brouillon avec succès',
                'status': 'draft'
            })
        else:
            # Si pas d'action spécifique, faire un update normal
            serializer = CourseCreateSerializer(course, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # SUPPRIMER la méthode delete pour éviter la suppression
    # def delete(self, request, pk):
    #     course = self.get_object(pk)
    #     course.delete()
    #     return Response(status=status.HTTP_204_NO_CONTENT)    
    def delete(self, request, pk):
        course = self.get_object(pk)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MyCourses(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)
        
        # Les formateurs voient tous leurs cours (même brouillons et archivés)
        courses = Course.objects.filter(creator=request.user)
        serializer = CourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)

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

# Module Views
class ModuleList(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Create a new module for a course"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ModuleCreateSerializer(
            data=request.data,
            context={'course': course}
        )
        
        if serializer.is_valid():
            module = serializer.save()
            return Response(ModuleSerializer(module).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Add this to your user/views.py
class UserManagementView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Filtrer par statut si spécifié
        status_filter = request.query_params.get('status')
        if status_filter:
            users = CustomUser.objects.filter(status=status_filter).order_by('-date_joined')
        else:
            users = CustomUser.objects.all().order_by('-date_joined')
        
        user_data = []
        
        for user in users:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}",
                'privilege': user.privilege,
                'privilege_display': user.get_privilege_display(),
                'department': user.department,
                'department_display': user.get_department_display(),
                'status': user.status,
                'status_display': 'Actif' if user.status == 1 else 'Suspendu',
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'course_count': user.created_courses.count(),
                'subscription_count': user.course_subscriptions.filter(is_active=True).count()
            })
        
        # User growth statistics
        user_growth = self.get_user_growth_stats()
        
        return Response({
            'users': user_data,
            'user_growth': user_growth
        })

# Add these to your user/views.py if you need them
# Add this at the top of your views.py file, near the other imports
class IsSuperUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.privilege == 'A'
from django.db.models import Count, Avg, Q, F, Sum
from django.db.models.functions import TruncMonth, TruncWeek, TruncDate
from datetime import timedelta, datetime
class RecommendedCoursesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recommended courses based on user's department, excluding subscribed courses"""
        try:
            user_department = request.user.department
            
            # Get user's subscribed course IDs first
            subscribed_course_ids = Subscription.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('course_id', flat=True)
            
            # Base query - seulement les cours actifs pour les apprenants
            base_query = Q(status=1)  # Seulement cours actifs
            
            if request.user.privilege in ['F', 'A']:
                # Les formateurs et admin voient aussi les brouillons
                base_query = Q(status__in=[0, 1])
            
            if not user_department:
                courses = Course.objects.filter(base_query).exclude(
                    id__in=subscribed_course_ids
                ).order_by('-created_at')[:20]
            else:
                courses = Course.objects.filter(
                    base_query & Q(creator__department=user_department)
                ).exclude(
                    id__in=subscribed_course_ids
                ).order_by('-created_at')
                
                if not courses.exists():
                    courses = Course.objects.filter(base_query).exclude(
                        id__in=subscribed_course_ids
                    ).order_by('-created_at')[:20]
            
            serializer = CourseSerializer(courses, many=True, context={'request': request})
            
            for course_data in serializer.data:
                course_data['is_subscribed'] = False
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recommended courses: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class SystemAnalyticsView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        try:
            print("Starting analytics view...")
            
            # Course completion rates
            course_stats = []
            for course in Course.objects.all():
                subscriptions = course.course_subscriptions.filter(is_active=True)
                total_subscribers = subscriptions.count()
                
                # Calculate total contents in course (across all modules)
                total_contents = CourseContent.objects.filter(module__course=course).count()
                
                # Calculate completion based on completed contents
                completed_count = 0
                for subscription in subscriptions:
                    completed_contents = subscription.completed_contents.count()
                    progress_percentage = (completed_contents / total_contents * 100) if total_contents > 0 else 0
                    if progress_percentage == 100:
                        completed_count += 1
                
                completion_rate = round((completed_count / total_subscribers * 100) if total_subscribers > 0 else 0)
                
                # Calculate average score
                try:
                    result = subscriptions.aggregate(avg=Avg('total_score'))
                    avg_value = result['avg']
                    average_score = round(avg_value) if avg_value is not None else 0
                except Exception as e:
                    print(f'Error calculating average score for course {course.id}: {e}')
                    average_score = 0
                
                course_stats.append({
                    'course_id': course.id,
                    'course_title': course.title_of_course,
                    'total_subscribers': total_subscribers,
                    'completed_count': completed_count,
                    'completion_rate': completion_rate,
                    'average_score': average_score
                })
            
            print("Course stats completed")
            
            # QCM performance - simplified
            try:
                qcm_stats = QCMCompletion.objects.values(
                    'qcm__course_content__module__course__title_of_course'
                ).annotate(
                    total_attempts=Count('id'),
                    avg_score=Avg('best_score'),
                    pass_count=Count('id', filter=Q(is_passed=True))
                )
                
                # Calculate pass rate manually
                qcm_stats_list = []
                for stat in qcm_stats:
                    total = stat['total_attempts']
                    passed = stat['pass_count']
                    pass_rate = round((passed / total * 100) if total > 0 else 0, 2)
                    
                    qcm_stats_list.append({
                        'course_title': stat['qcm__course_content__module__course__title_of_course'],
                        'total_attempts': total,
                        'avg_score': round(stat['avg_score'] or 0, 2),
                        'pass_rate': pass_rate
                    })
                
                print("QCM stats completed")
            except Exception as e:
                print(f"Error in QCM stats: {e}")
                qcm_stats_list = []
            
            # User engagement
            total_users = CustomUser.objects.count()
            active_users = CustomUser.objects.filter(
                last_login__gte=timezone.now() - timedelta(days=30)
            ).count()
            engagement_rate = round((active_users / total_users * 100) if total_users > 0 else 0)
            
            print("User engagement completed")
            
            # Learning progress distribution
            progress_distribution = self.get_progress_distribution()
            print("Progress distribution completed")
            
            # Weekly activity data
            weekly_activity = self.get_weekly_activity()
            print("Weekly activity completed")
            
            return Response({
                'course_statistics': course_stats,
                'qcm_performance': qcm_stats_list,
                'user_engagement': {
                    'active_users_30d': active_users,
                    'total_users': total_users,
                    'engagement_rate': engagement_rate
                },
                'progress_distribution': progress_distribution,
                'weekly_activity': weekly_activity
            })
            
        except Exception as e:
            print(f"Error in SystemAnalyticsView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Internal server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
            try:
                # Count subscriptions with progress percentage in this range
                count = Subscription.objects.filter(
                    is_active=True,
                    progress_percentage__gte=min_val,
                    progress_percentage__lte=max_val
                ).count()
                distribution.append({'range': label, 'count': count})
            except Exception as e:
                print(f"Error in progress distribution for range {label}: {e}")
                distribution.append({'range': label, 'count': 0})
        
        return distribution
    
    def get_weekly_activity(self):
        twelve_weeks_ago = timezone.now() - timedelta(weeks=12)
        
        try:
            weekly_activity = (
                QCMCompletion.objects
                .filter(last_attempt__gte=twelve_weeks_ago)
                .annotate(week=TruncWeek('last_attempt'))
                .values('week')
                .annotate(active_users=Count('user', distinct=True))
                .order_by('week')
            )
            
            return {
                'labels': [item['week'].strftime('%Y-%m-%d') for item in weekly_activity],
                'data': [item['active_users'] for item in weekly_activity]
            }
        except Exception as e:
            print(f"Error in weekly activity: {e}")
            return {'labels': [], 'data': []}

class ContentManagementView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        contents = CourseContent.objects.all().select_related('module__course', 'content_type')
        content_data = []
        
        for content in contents:
            try:
                qcm_attempts = 0
                if hasattr(content, 'qcm'):
                    qcm_attempts = content.qcm.attempts.count()
                
                content_data.append({
                    'id': content.id,
                    'title': content.title,
                    'course': content.module.course.title_of_course,
                    'module': content.module.title,
                    'content_type': content.content_type.name,
                    'order': content.order,
                    'qcm_attempts': qcm_attempts,
                })
            except Exception as e:
                print(f"Database error: {e}")
        
        # Content type distribution
        content_type_stats = (
            CourseContent.objects
            .values('content_type__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        # Content usage statistics
        content_usage = self.get_content_usage_stats()
        
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
            .values('title', 'module__course__title_of_course', 'attempts_count')
        )
        
        return {
            'labels': [f"{item['title']} ({item['module__course__title_of_course']})" for item in popular_content],
            'data': [item['attempts_count'] for item in popular_content]
        }

class UserDetailView(APIView):
    permission_classes = [IsSuperUser]
    
    def get_user_growth_stats(self):
        """Calculate user growth statistics over time"""
        # Get user registration counts by date
        growth_data = (
            CustomUser.objects
            .annotate(registration_date=TruncDate('date_joined'))
            .values('registration_date')
            .annotate(user_count=Count('id'))
            .order_by('registration_date')
        )
        
        # Format the data
        growth_stats = [
            {
                'date': item['registration_date'].isoformat() if item['registration_date'] else None,
                'user_count': item['user_count']
            }
            for item in growth_data
        ]
        
        return growth_stats
    
    def get_user_learning_stats(self, user):
        """Calculate user learning statistics"""
        return {
            'total_courses_enrolled': user.course_subscriptions.filter(is_active=True).count(),
            'total_courses_completed': user.course_subscriptions.filter(
                is_active=True, 
                progress_percentage=100
            ).count(),
            'average_score': user.course_subscriptions.filter(is_active=True).aggregate(
                avg_score=Avg('total_score')
            )['avg_score'] or 0,
            'total_learning_time': 0  # Placeholder
        }
    
    def get(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id)
        
        # User learning statistics
        learning_stats = self.get_user_learning_stats(user)
        user_growth = self.get_user_growth_stats()
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'privilege': user.privilege,
            'privilege_display': user.get_privilege_display(),
            'department': user.department,
            'department_display': user.get_department_display(),
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
                    'score': sub.total_score
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
            'learning_stats': learning_stats,
            'user_growth_stats': user_growth
        }
        
        return Response({'user': user_data})
# REMOVE these top-level imports from views.py:
# import subprocess
# import psutil
# import datetime

# Keep only these imports at the top:
from django.contrib.sessions.models import Session
from django.utils import timezone

class SystemHealthView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        # System performance metrics
        system_metrics = {
            'database_size': self.get_database_size(),
            'active_sessions': self.get_active_sessions(),
            'server_uptime': self.get_server_uptime(),
            'error_rate': self.get_error_rate(),
            'database_vendor': self.get_database_vendor(),
            'memory_usage': self.get_memory_usage(),
            'cpu_usage': self.get_cpu_usage(),
            'disk_usage': self.get_disk_usage()
        }
        
        return Response({
            'system_metrics': system_metrics,
            'performance_stats': self.get_performance_stats(),
            'timestamp': timezone.now().isoformat()
        })
    
    def get_server_uptime(self):
        """Get server uptime - works in Docker containers"""
        try:
            # Import inside the method
            import datetime
            # Method 1: Read from /proc/uptime (Linux/Docker)
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.readline().split()[0])
                days = int(uptime_seconds // 86400)
                hours = int((uptime_seconds % 86400) // 3600)
                minutes = int((uptime_seconds % 3600) // 60)
                return f"{days} days, {hours} hours, {minutes} minutes"
                
        except (FileNotFoundError, PermissionError):
            try:
                # Method 2: Use psutil as fallback - import inside method
                import psutil
                import datetime
                boot_time = datetime.datetime.fromtimestamp(psutil.boot_time())
                uptime = datetime.datetime.now() - boot_time
                days = uptime.days
                hours = uptime.seconds // 3600
                minutes = (uptime.seconds % 3600) // 60
                return f"{days} days, {hours} hours, {minutes} minutes"
                
            except Exception:
                return "Uptime unavailable"
        except Exception as e:
            return f"Uptime error: {str(e)}"
    
    def get_error_rate(self):
        """Get error rate - placeholder for actual implementation"""
        try:
            # This would ideally come from your monitoring system
            from django.core.cache import cache
            
            # Get from cache or use default
            error_count = cache.get('system_error_count', 15)
            total_requests = cache.get('system_total_requests', 5000)
            
            if total_requests > 0:
                error_rate = (error_count / total_requests) * 100
                return f"{error_rate:.2f}%"
            
            return "0.30%"  # Default fallback
            
        except Exception as e:
            return "Error rate unavailable"
    
    def get_memory_usage(self):
        """Get memory usage of the container"""
        try:
            # Import inside the method
            import psutil
            memory = psutil.virtual_memory()
            return {
                'total': f"{memory.total // (1024**2)} MB",
                'available': f"{memory.available // (1024**2)} MB",
                'used': f"{memory.used // (1024**2)} MB",
                'percent': f"{memory.percent}%"
            }
        except Exception:
            return "Memory usage unavailable"
    
    def get_cpu_usage(self):
        """Get CPU usage"""
        try:
            # Import inside the method
            import psutil
            cpu_percent = psutil.cpu_percent(interval=1)
            return f"{cpu_percent}%"
        except Exception:
            return "CPU usage unavailable"
    
    def get_disk_usage(self):
        """Get disk usage"""
        try:
            # Import inside the method
            import psutil
            disk = psutil.disk_usage('/')
            return {
                'total': f"{disk.total // (1024**3)} GB",
                'used': f"{disk.used // (1024**3)} GB",
                'free': f"{disk.free // (1024**3)} GB",
                'percent': f"{disk.percent}%"
            }
        except Exception:
            return "Disk usage unavailable"
    
    def get_performance_stats(self):
        """Get performance statistics - placeholder for real monitoring"""
        try:
            # This would come from your APM tool
            stats = {
                'labels': ['Auth', 'Courses', 'Content', 'QCM', 'Database', 'Cache'],
                'data': [95, 210, 165, 280, 75, 40],
                'request_counts': [1200, 650, 950, 450, 0, 0],
                'error_rates': [0.8, 1.5, 1.2, 2.5, 0.2, 0.4]
            }
            return stats
            
        except Exception as e:
            return {
                'labels': ['Auth', 'Courses', 'Content', 'QCM'],
                'data': [120, 250, 180, 300],
                'request_counts': [0, 0, 0, 0],
                'error_rates': [0, 0, 0, 0]
            }
    
    def get_database_size(self):
        """Get database size"""
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                vendor = connection.vendor
                
                if vendor == 'postgresql':
                    cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
                elif vendor == 'mysql':
                    cursor.execute("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) FROM information_schema.tables WHERE table_schema = DATABASE()")
                elif vendor == 'sqlite':
                    import os
                    from django.conf import settings
                    db_path = settings.DATABASES['default']['NAME']
                    size_bytes = os.path.getsize(db_path)
                    return f"{round(size_bytes / (1024 * 1024), 2)} MB"
                else:
                    return "Unknown database type"
                
                row = cursor.fetchone()
                return row[0] if row else "Unknown"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def get_database_vendor(self):
        from django.db import connection
        return connection.vendor
    
    def get_active_sessions(self):
        from django.contrib.sessions.models import Session
        return Session.objects.count()
class ModuleDetail(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, course_pk, module_pk):
        course = get_object_or_404(Course, pk=course_pk)
        return get_object_or_404(Module, pk=module_pk, course=course)
    
    def get(self, request, course_pk, module_pk):
        module = self.get_object(course_pk, module_pk)
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    
    def put(self, request, course_pk, module_pk):
        module = self.get_object(course_pk, module_pk)
        
        if module.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ModuleSerializer(module, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, course_pk, module_pk):
        module = self.get_object(course_pk, module_pk)
        
        if module.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Content Views
class CourseContentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            course = get_object_or_404(Course, pk=pk)
            user = request.user
            
            # Get user's subscription for this course
            subscription = Subscription.objects.filter(
                user=user,
                course=course,
                is_active=True
            ).first()
            
            # Get all modules with their contents
            modules = course.modules.all().order_by('order')
            
            # Pass subscription to serializer context
            module_data = []
            for module in modules:
                module_serializer = ModuleSerializer(module)
                contents = module.contents.all().order_by('order')
                
                content_serializer = CourseContentSerializer(
                    contents, 
                    many=True, 
                    context={
                        'request': request,
                        'subscription': subscription
                    }
                )
                
                module_data.append({
                    **module_serializer.data,
                    'contents': content_serializer.data
                })
            
            return Response(module_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class CourseContentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self, course_pk, content_pk):
        course = get_object_or_404(Course, pk=course_pk)
        return get_object_or_404(CourseContent, pk=content_pk, module__course=course)
    
    def get(self, request, course_pk, content_pk):
        try:
            content = self.get_object(course_pk, content_pk)
            serializer = CourseContentSerializer(content, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, course_pk, content_pk):
        content = self.get_object(course_pk, content_pk)
        
        if content.module.course.creator != request.user:
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
        content = self.get_object(course_pk, content_pk)
        
        if content.module.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CreatePDFContentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    def post(self, request, course_id, module_id):  # Changed from 'pk' to 'course_id, module_id'
        print('---------------------------------------------Create PDF content in a module')
        module = get_object_or_404(Module, pk=module_id)  # Use module_id instead of pk
        if module.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        print('---------------------------------------------Create PDF content in a module')
        content_type, created = ContentType.objects.get_or_create(name='pdf')
        print('---------------------------------------------Create PDF content in a module')
        serializer = PDFContentCreateSerializer(
            data=request.data,
            context={
                'request': request,
                'module': module,
                'content_type': content_type
            }
        )
        print('---------------------------------------------Create PDF content in a module')
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
    
    def post(self, request, course_id, module_id):
        """Create Video content in a module"""
        module = get_object_or_404(Module, pk=module_id)
        
        if module.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content_type, created = ContentType.objects.get_or_create(name='Video')
        
        serializer = VideoContentCreateSerializer(
            data=request.data, 
            context={
                'request': request,
                'module': module,
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
    
    def post(self, request, course_id, module_id):
        """Create QCM quiz content in a module"""
        module = get_object_or_404(Module, pk=module_id)
        
        if module.course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content_type, created = ContentType.objects.get_or_create(name='QCM')
        
        serializer = QCMContentCreateSerializer(
            data=request.data, 
            context={
                'request': request,
                'module': module,
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

# Content Completion Views
class MarkVideoCompletedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            course = get_object_or_404(Course, pk=pk)
            user = request.user
            content_id = request.data.get('content_id')
            
            # Get content
            content = CourseContent.objects.get(id=content_id, module__course=course)
            
            if content.content_type.name != 'Video':
                return Response({'error': 'Content is not a Video'}, status=400)
            
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            
            # Mark as completed
            if not subscription.completed_contents.filter(id=content.id).exists():
                subscription.completed_contents.add(content)
            
            # Update progress percentage
            total_contents = CourseContent.objects.filter(module__course=course).count()
            completed_count = subscription.completed_contents.count()
            progress_percentage = (completed_count / total_contents) * 100 if total_contents > 0 else 0
            
            subscription.progress_percentage = progress_percentage
            subscription.save()
            
            return Response({
                'status': 'Video marked as completed',
                'progress_percentage': progress_percentage,
                'completed_contents': list(subscription.completed_contents.values_list('id', flat=True))
            })
            
        except CourseContent.DoesNotExist:
            return Response({'error': 'Content not found'}, status=404)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found. Please subscribe to the course first.'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class MarkPDFCompletedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            course = get_object_or_404(Course, pk=pk)
            user = request.user
            content_id = request.data.get('content_id')
            
            # Get the course content
            content = CourseContent.objects.get(id=content_id, module__course=course)
            
            if content.content_type.name.lower() != 'pdf':
                return Response({'error': 'Content is not a pdf'}, status=400)
            
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)

            # Mark as completed in subscription
            if not subscription.completed_contents.filter(id=content.id).exists():
                subscription.completed_contents.add(content)
            
            # Update progress percentage
            total_contents = CourseContent.objects.filter(module__course=course).count()
            completed_count = subscription.completed_contents.count()
            progress_percentage = (completed_count / total_contents) * 100 if total_contents > 0 else 0
            
            subscription.progress_percentage = progress_percentage
            subscription.save()
            
            # Serialize the PDF content
            serializer = PDFContentSerializer(content.pdf_content, context={'request': request})
            
            return Response({
                'status': 'PDF marked as completed',
                'progress_percentage': progress_percentage,
                'completed_contents': list(subscription.completed_contents.values_list('id', flat=True)),
                'pdf_content': serializer.data
            })
            
        except CourseContent.DoesNotExist:
            return Response({'error': 'Content not found'}, status=404)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found. Please subscribe to the course first.'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

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
        
        # Check if user is subscribed
        subscription = Subscription.objects.filter(
            user=user, 
            course=course,
            is_active=True
        ).first()
        
        is_subscribed = subscription is not None
        
        # Calculate progress percentage if subscribed
        progress_percentage = 0
        if is_subscribed:
            total_contents = CourseContent.objects.filter(module__course=course).count()
            completed_count = subscription.completed_contents.count()
            if total_contents > 0:
                progress_percentage = (completed_count / total_contents) * 100
        
        response_data = {
            'id': course.id,
            'title': course.title_of_course,
            'description': course.description,
            'image': course.image.url if course.image else '',
            'creator_username': course.creator.username,
            'created_at': course.created_at.isoformat() if course.created_at else '',
            'updated_at': course.updated_at.isoformat() if course.updated_at else '',
            'is_subscribed': is_subscribed,
            'progress_percentage': progress_percentage,
        }
        
        return Response(response_data)

class MySubscriptions(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Get courses where user has active subscription
        subscriptions = Subscription.objects.filter(user=request.user, is_active=True)
        courses = [subscription.course for subscription in subscriptions]
        
        serializer = CourseSerializer(
            courses, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)

# QCM Views
class SubmitQCM(APIView):
    def post(self, request, pk):
        try:
            course = get_object_or_404(Course, pk=pk)
            user = request.user
            content_id = request.data.get('content_id')
            
            # Get the QCM content
            content = get_object_or_404(CourseContent, id=content_id, module__course=course)
            
            if content.content_type.name.lower() != 'qcm':
                return Response({'error': 'Content is not a QCM'}, status=400)
            
            qcm = content.qcm
            if not qcm:
                return Response({'error': 'QCM not found for this content'}, status=404)
            
            # Get or create subscription
            subscription, created = Subscription.objects.get_or_create(
                user=user,
                course=course,
                defaults={'is_active': True}
            )
            
            serializer = QCMAttemptSerializer(data=request.data)
            
            if serializer.is_valid():
                attempt = QCMAttempt.objects.create(
                    user=user,
                    qcm=qcm,
                    time_taken=request.data.get('time_taken', 0),
                    attempt_number=self.get_next_attempt_number(user, qcm)
                )
                
                # Assign selected options manually
                selected_option_ids = serializer.validated_data['selected_option_ids']
                selected_options = QCMOption.objects.filter(id__in=selected_option_ids, qcm=qcm)
                attempt.selected_options.set(selected_options)

                # Calculate score and finalize
                attempt.completed_at = timezone.now()
                attempt.calculate_score()
                
                # Update or create QCMCompletion
                qcm_completion, created = QCMCompletion.objects.get_or_create(
                    subscription=subscription,
                    qcm=qcm,
                    defaults={
                        'best_score': attempt.score,
                        'points_earned': attempt.points_earned,
                        'is_passed': attempt.is_passed,
                        'attempts_count': 1
                    }
                )
                
                # Update existing completion if this attempt is better
                if not created:
                    qcm_completion.attempts_count += 1
                    if attempt.score > qcm_completion.best_score:
                        qcm_completion.best_score = attempt.score
                        qcm_completion.points_earned = attempt.points_earned
                        qcm_completion.is_passed = attempt.is_passed
                    qcm_completion.save()
                
                # Update subscription progress if passed
                if attempt.is_passed:
                    # Add to completed contents
                    subscription.completed_contents.add(content)
                    
                    # Update progress percentage
                    total_contents = CourseContent.objects.filter(module__course=course).count()
                    completed_count = subscription.completed_contents.count()
                    progress_percentage = (completed_count / total_contents) * 100 if total_contents > 0 else 0
                    
                    subscription.progress_percentage = progress_percentage
                    subscription.save()
                    
                    # Update total score
                    subscription.update_total_score()
                    
                    response_data = QCMAttemptSerializer(attempt).data
                    response_data['progress_percentage'] = progress_percentage
                    response_data['completed_contents'] = list(subscription.completed_contents.values_list('id', flat=True))
                    response_data['qcm_completion_id'] = qcm_completion.id
                    response_data['qcm_completed'] = True
                    response_data['total_score'] = subscription.total_score
                    
                    return Response(response_data, status=201)
                else:
                    response_data = QCMAttemptSerializer(attempt).data
                    response_data['qcm_completion_id'] = qcm_completion.id
                    response_data['qcm_completed'] = False
                    response_data['total_score'] = subscription.total_score
                    return Response(response_data, status=201)
            else:
                return Response(serializer.errors, status=400)
                
        except Exception as e:
            print('Error in SubmitQCM:', str(e))
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    def get_next_attempt_number(self, user, qcm):
        last_attempt = QCMAttempt.objects.filter(user=user, qcm=qcm).order_by('-attempt_number').first()
        return last_attempt.attempt_number + 1 if last_attempt else 1
class QCMProgress(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        user = request.user
        
        try:
            subscription = Subscription.objects.get(user=user, course=course, is_active=True)
            completions = QCMCompletion.objects.filter(
                subscription=subscription,
                qcm__course_content__module__course=course
            )
            
            serializer = QCMCompletionSerializer(completions, many=True)
            
            # Calculate totals
            total_qcms = QCM.objects.filter(course_content__module__course=course).count()
            passed_qcms = completions.filter(is_passed=True).count()
            total_points = subscription.total_score
            max_points = sum(qcm.points for qcm in QCM.objects.filter(course_content__module__course=course))
            
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
            content = CourseContent.objects.get(id=content_id, module__course=course)
            
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

class CourseContentCompletionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get completion status for all contents in a course"""
        course = get_object_or_404(Course, pk=pk)
        
        try:
            subscription = Subscription.objects.get(
                user=request.user,
                course=course,
                is_active=True
            )
            
            contents = CourseContent.objects.filter(module__course=course).order_by('order')
            completion_data = []
            
            for content in contents:
                is_completed = False
                
                if content.content_type.name == 'qcm':
                    is_completed = QCMCompletion.objects.filter(
                        subscription=subscription,
                        qcm=content.qcm,
                        is_passed=True
                    ).exists()
                else:
                    is_completed = subscription.completed_contents.filter(id=content.id).exists()
                
                completion_data.append({
                    'content_id': content.id,
                    'title': content.title,
                    'content_type': content.content_type.name,
                    'order': content.order,
                    'is_completed': is_completed
                })
            
            return Response(completion_data)
            
        except Subscription.DoesNotExist:
            return Response({'error': 'Not subscribed to this course'}, status=404)
class CourseSubscribersListViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, pk=None):
        """Get detailed list of subscribers with their progress"""
        course = get_object_or_404(Course, pk=pk)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You are not the creator of this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        subscribers = course.course_subscriptions.filter(is_active=True).select_related('user')
        
        # Create subscriber data manually
        subscriber_data = []
        for subscription in subscribers:
            # Calculate progress percentage
            total_contents = CourseContent.objects.filter(module__course=course).count()
            completed_count = subscription.completed_contents.count()
            progress_percentage = (completed_count / total_contents * 100) if total_contents > 0 else 0
            
            subscriber_data.append({
                'id': subscription.id,
                'user': {
                    'id': subscription.user.id,
                    'username': subscription.user.username,
                    'email': subscription.user.email,
                    'full_name': f"{subscription.user.first_name} {subscription.user.last_name}",
                    'department': subscription.user.department,
                    'department_display': subscription.user.get_department_display(),
                },
                'subscribed_at': subscription.subscribed_at,
                'is_active': subscription.is_active,
                'progress_percentage': round(progress_percentage, 2),
                'total_score': subscription.total_score,
                'completed_contents_count': completed_count,
                'total_contents_count': total_contents
            })
        
        # Manual pagination
        page_size = request.query_params.get('page_size', 10)
        paginator = Paginator(subscriber_data, page_size)
        page_number = request.query_params.get('page', 1)
        
        try:
            page = paginator.page(page_number)
        except PageNotAnInteger:
            page = paginator.page(1)
        except EmptyPage:
            page = paginator.page(paginator.num_pages)
        
        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page.number,
            'next': page.next_page_number() if page.has_next() else None,
            'previous': page.previous_page_number() if page.has_previous() else None,
            'results': page.object_list
        })

from django.db.models import Q, Count, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncMonth

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
            max_progress=Max('progress_percentage'),
            min_progress=Min('progress_percentage')
        )
        
        # Get score statistics
        score_stats = course.course_subscriptions.filter(is_active=True).aggregate(
            avg_score=Avg('total_score'),
            max_score=Max('total_score'),
            min_score=Min('total_score')
        )
        
        # Get completion statistics
        completed_count = course.course_subscriptions.filter(
            is_active=True, 
            progress_percentage=100
        ).count()
        
        completion_rate = (completed_count / active_subscriptions * 100) if active_subscriptions > 0 else 0
        
        # Get QCM performance statistics
        qcm_completions = QCMCompletion.objects.filter(
            subscription__course=course,
            subscription__is_active=True
        )
        
        qcm_stats = qcm_completions.aggregate(
            avg_attempts=Avg('attempts_count'),
            avg_score=Avg('best_score'),
            pass_rate=Avg('is_passed', output_field=models.FloatField()) * 100
        )
        
        # Get total QCM attempts for the course
        total_qcm_attempts = QCMAttempt.objects.filter(
            qcm__course_content__module__course=course
        ).count()
        
        # Get recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_activity = course.course_subscriptions.filter(
            is_active=True,
            last_activity__gte=week_ago  # Make sure your Subscription model has last_activity field
        ).count()
        
        # Alternative recent activity based on QCM attempts if no last_activity field
        if not hasattr(Subscription, 'last_activity'):
            recent_activity = QCMAttempt.objects.filter(
                qcm__course_content__module__course=course,
                completed_at__gte=week_ago
            ).values('user').distinct().count()
        
        # Get enrollment trend (monthly for last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        enrollment_trend = course.course_subscriptions.filter(
            subscribed_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('subscribed_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Format enrollment trend data
        formatted_enrollment_trend = [
            {'month': entry['month'].strftime('%Y-%m'), 'count': entry['count']}
            for entry in enrollment_trend
        ]
        
        data = {
            'course': {
                'id': course.id,
                'title': course.title_of_course,
                'creator': course.creator.get_full_name() or course.creator.username,
                'created_at': course.created_at.isoformat() if course.created_at else None
            },
            'subscriptions': {
                'total': total_subscriptions,
                'active': active_subscriptions,
                'inactive': inactive_subscriptions,
                'completion_rate': round(completion_rate, 2)
            },
            'progress': {
                'average': round(progress_stats['avg_progress'] or 0, 2),
                'maximum': round(progress_stats['max_progress'] or 0, 2),
                'minimum': round(progress_stats['min_progress'] or 0, 2),
                'completed': completed_count
            },
            'scores': {
                'average': round(score_stats['avg_score'] or 0, 2),
                'maximum': score_stats['max_score'] or 0,
                'minimum': score_stats['min_score'] or 0
            },
            'qcm_performance': {
                'average_attempts': round(qcm_stats['avg_attempts'] or 0, 2),
                'average_score': round(qcm_stats['avg_score'] or 0, 2),
                'pass_rate': round(qcm_stats['pass_rate'] or 0, 2),
                'total_attempts': total_qcm_attempts
            },
            'activity': {
                'recent_activity': recent_activity,
                'enrollment_trend': formatted_enrollment_trend
            }
        }
        
        return Response(data)
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
        
        # Get all active subscriptions
        active_subscriptions = course.course_subscriptions.filter(is_active=True)
        
        # Calculate progress for each subscription
        progress_data = []
        for subscription in active_subscriptions:
            # Calculate progress percentage based on completed contents vs total contents
            total_contents = CourseContent.objects.filter(module__course=course).count()
            completed_contents = subscription.completed_contents.count()
            progress_percentage = (completed_contents / total_contents * 100) if total_contents > 0 else 0
            
            progress_data.append({
                'subscription': subscription,
                'progress_percentage': progress_percentage
            })
        
        # Get progress distribution
        progress_distribution = {
            '0-20%': len([p for p in progress_data if 0 <= p['progress_percentage'] <= 20]),
            '21-40%': len([p for p in progress_data if 21 <= p['progress_percentage'] <= 40]),
            '41-60%': len([p for p in progress_data if 41 <= p['progress_percentage'] <= 60]),
            '61-80%': len([p for p in progress_data if 61 <= p['progress_percentage'] <= 80]),
            '81-99%': len([p for p in progress_data if 81 <= p['progress_percentage'] <= 99]),
            '100%': len([p for p in progress_data if p['progress_percentage'] == 100])
        }
        
        # Get average time to complete (only for 100% completed)
        completed_subscriptions = [p for p in progress_data if p['progress_percentage'] == 100]
        
        avg_completion_time = None
        if completed_subscriptions:
            total_time = timedelta()
            for p in completed_subscriptions:
                subscription = p['subscription']
                if subscription.last_activity and subscription.subscribed_at:
                    total_time += (subscription.last_activity - subscription.subscribed_at)
            
            if total_time:
                avg_completion_time = total_time / len(completed_subscriptions)
        
        return Response({
            'progress_distribution': progress_distribution,
            'average_completion_time': avg_completion_time.total_seconds() / 86400 if avg_completion_time else 0,
            'total_learners': len(progress_data),
            'active_this_week': active_subscriptions.filter(
                last_activity__gte=timezone.now() - timedelta(days=7)
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
        
        # Get all QCMs in this course (through the module relationship)
        qcms = QCM.objects.filter(course_content__module__course=course)
        
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
        
        # Calculate overall pass rate
        overall_pass_rate = 0
        if qcm_performance:
            total_pass_rate = sum(item['pass_rate'] for item in qcm_performance)
            overall_pass_rate = total_pass_rate / len(qcm_performance)
        
        return Response({
            'total_qcms': qcms.count(),
            'qcm_performance': qcm_performance,
            'overall_pass_rate': round(overall_pass_rate, 2)
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
class SubscriptionStats(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        subscriptions = course.course_subscriptions.all()
        total = subscriptions.count()
        active = subscriptions.filter(is_active=True).count()
        
        # Additional stats
        recent_subscriptions = subscriptions.filter(
            subscribed_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Calculate average completion based on completed contents
        # Since we don't have completed_qcms field, we'll use progress_percentage
        avg_completion = subscriptions.aggregate(
            avg_progress=Avg('progress_percentage')
        )['avg_progress'] or 0

        return Response({
            'total_subscriptions': total,
            'active_subscriptions': active,
            'inactive_subscriptions': total - active,
            'recent_subscriptions_30d': recent_subscriptions,
            'average_progress_percentage': round(avg_completion, 2),
            'completion_rate': round((active / total * 100) if total > 0 else 0, 2)
        })
class CourseLeaderboard(APIView):
    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        
        # Get top subscribers by score
        leaderboard = course.course_subscriptions.filter(
            is_active=True
        ).order_by('-score', '-progress_percentage')[:10]
        
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

# Admin Dashboard Views
class IsSuperUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) or request.user.privilege == 'A'

class AdminDashboardView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        total_users = CustomUser.objects.count()
        total_courses = Course.objects.count()
        total_subscriptions = Subscription.objects.filter(is_active=True).count()
        
        week_ago = timezone.now() - timedelta(days=7)
        recent_users = CustomUser.objects.filter(date_joined__gte=week_ago).count()
        recent_courses = Course.objects.filter(created_at__gte=week_ago).count()
        
        user_distribution = CustomUser.objects.values('privilege').annotate(
            count=Count('id')
        )
        
        user_registration_data = self.get_user_registration_chart_data()
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

            # Calculate total QCMs in course
            total_qcms = QCM.objects.filter(course_content__module__course=course).count()
            
            completed_count = 0
            for subscription in subscriptions:
                # Calculate completed QCMs for this subscription
                completed_qcms = subscription.completed_qcms.count()
                progress_percentage = (completed_qcms / total_qcms * 100) if total_qcms > 0 else 0

                if progress_percentage == 100:
                    completed_count += 1

            completion_rate = round((completed_count / total_subscribers * 100) if total_subscribers > 0 else 0)

            try:
                result = subscriptions.aggregate(avg=Avg('total_score'))
                avg_value = result['avg']
                average_score = round(avg_value) if avg_value is not None else 0
            except Exception as e:
                print('Error calculating average score:', e)
                average_score = 0

            course_data.append({
                'id': course.id,
                'title': course.title_of_course,
                'creator': course.creator.username,
                'created_at': course.created_at,
                'total_subscribers': total_subscribers,
                'completed_count': completed_count,
                'completion_rate': completion_rate,
                'average_score': average_score,
                'total_qcms': total_qcms
            })

        return course_data

# Course ViewSet for additional functionality
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='my-courses')
    def my_courses(self, request):
        """Get courses the user is subscribed to"""
        try:
            # Get all active subscriptions for the user
            subscribed_course_ids = Subscription.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('course_id', flat=True)
            
            # Get the actual course objects
            courses = Course.objects.filter(
                id__in=subscribed_course_ids
            ).select_related('creator').order_by('-created_at')
            
            # Serialize the courses
            serializer = self.get_serializer(courses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch subscribed courses: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='recommended')
    def recommended_courses(self, request):
        """Get recommended courses based on user's department"""
        try:
            user_department = request.user.department
            
            if not user_department:
                # If user has no department, return all courses
                courses = Course.objects.select_related('creator').order_by('-created_at')
            else:
                # Get courses from users in the same department or courses targeted to this department
                courses = Course.objects.select_related('creator').filter(
                    Q(creator__department=user_department) | 
                    Q(target_departments__icontains=user_department) |
                    Q(target_departments__isnull=True) |
                    Q(target_departments='')
                ).distinct().order_by('-created_at')
            
            # Get user's subscribed course IDs to mark them
            subscribed_course_ids = set(
                Subscription.objects.filter(
                    user=request.user,
                    is_active=True
                ).values_list('course_id', flat=True)
            )
            
            # Serialize the courses and add subscription status
            serializer = self.get_serializer(courses, many=True)
            
            # Add is_subscribed field to each course
            for course_data in serializer.data:
                course_data['is_subscribed'] = course_data['id'] in subscribed_course_ids
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recommended courses: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Alternative class-based views
class MyCoursesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get courses the user is subscribed to"""
        try:
            # Get all active subscriptions for the user
            subscriptions = Subscription.objects.select_related('course', 'course__creator').filter(
                user=request.user,
                is_active=True
            ).order_by('-course__created_at')
            
            # Extract courses from subscriptions
            courses = [subscription.course for subscription in subscriptions]
            
            # Serialize the courses
            serializer = CourseSerializer(courses, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch subscribed courses: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RecommendedCoursesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recommended courses based on user's department, excluding subscribed courses"""
        try:
            user_department = request.user.department
            
            # Get user's subscribed course IDs first
            subscribed_course_ids = Subscription.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('course_id', flat=True)
            
            if not user_department:
                # If user has no department, return recent courses excluding subscribed ones
                courses = Course.objects.select_related('creator').exclude(
                    id__in=subscribed_course_ids
                ).order_by('-created_at')[:20]
            else:
                # Get courses from users in the same department, excluding subscribed ones
                courses = Course.objects.select_related('creator').filter(
                    creator__department=user_department
                ).exclude(
                    id__in=subscribed_course_ids
                ).order_by('-created_at')
                
                # If no courses in user's department (excluding subscribed), get all recent courses excluding subscribed
                if not courses.exists():
                    courses = Course.objects.select_related('creator').exclude(
                        id__in=subscribed_course_ids
                    ).order_by('-created_at')[:20]
            
            # Serialize the courses
            serializer = CourseSerializer(courses, many=True, context={'request': request})
            
            # Since we already excluded subscribed courses, all should be is_subscribed: false
            for course_data in serializer.data:
                course_data['is_subscribed'] = False
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recommended courses: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models import Course, Enrollment, ContentProgress
from .serializers import CourseStatsSerializer

class CourseStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            course = Course.objects.get(id=pk)

            # Check if user has permission to view stats (creator or admin)
            if course.creator != request.user and not request.user.is_staff:
                return Response({"error": "Permission denied"}, status=403)

            # Get enrollment statistics
            enrollments = Enrollment.objects.filter(course=course)
            total_enrollments = enrollments.count()
            completed_enrollments = enrollments.filter(completed=True).count()
            average_progress = enrollments.aggregate(avg_progress=Avg('progress'))['avg_progress'] or 0

            # Get recent enrollments (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_enrollments = enrollments.filter(
                enrolled_at__gte=thirty_days_ago
            ).order_by('-enrolled_at')[:10]

            # For now, return empty content engagement until you have the Content model
            content_engagement = []

            stats_data = {
                'total_enrollments': total_enrollments,
                'completed_enrollments': completed_enrollments,
                'average_progress': int(average_progress),
                'recent_enrollments': recent_enrollments,
                'content_engagement': content_engagement
            }

            serializer = CourseStatsSerializer(stats_data)
            return Response(serializer.data)

        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=404)

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Course, Module, CourseContent, Subscription
from .serializers import ModuleSerializer, ModuleWithContentsSerializer

class ModuleDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self, course_id, module_id):
        course = get_object_or_404(Course, id=course_id)
        return get_object_or_404(Module, id=module_id, course=course)
    
    def get(self, request, course_id, module_id):
        module = self.get_object(course_id, module_id)
        
        # Get user subscription for progress tracking
        subscription = None
        if request.user and request.user.is_authenticated:
            subscription = Subscription.objects.filter(
                user=request.user,
                course_id=course_id,
                is_active=True
            ).first()
        
        # Use prefetch_related for optimal performance
        module = Module.objects.prefetch_related(
            'contents__content_type',
            'contents__video_content',
            'contents__pdf_content', 
            'contents__qcm__options'
        ).get(id=module_id, course_id=course_id)
        print('6666666666666666666666666666666666', module)
        serializer = ModuleWithContentsSerializer(
            module, 
            context={'request': request, 'subscription': subscription}
        )
        return Response(serializer.data)
    
    def put(self, request, course_id, module_id):
        module = self.get_object(course_id, module_id)
        course = get_object_or_404(Course, id=course_id)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You do not have permission to edit this module'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ModuleSerializer(module, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, course_id, module_id):
        module = self.get_object(course_id, module_id)
        course = get_object_or_404(Course, id=course_id)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You do not have permission to delete this module'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        
        # Get user subscription for progress tracking
        subscription = None
        if request.user and request.user.is_authenticated:
            subscription = Subscription.objects.filter(
                user=request.user,
                course=course,
                is_active=True
            ).first()
        # Optimize query with prefetch_related
        modules = Module.objects.filter(course=course).prefetch_related(
            'contents__content_type',
            'contents__video_content',
            'contents__pdf_content',
            'contents__qcm__options'
        ).order_by('order')
        
        serializer = ModuleWithContentsSerializer(
            modules, 
            many=True,
            context={'request': request, 'subscription': subscription}
        )
        # print('++++++++++++++sssssssssssssssssssssssssssssssssssss', serializer.data)
        return Response(serializer.data)
    
    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        
        if course.creator != request.user:
            return Response(
                {'error': 'You do not have permission to add modules to this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ModuleSerializer(data=request.data)
        print('Creating module...') # Debug print
        
        if serializer.is_valid():
            serializer.save(course=course)
            print('Module created successfully!')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print('Validation errors:', serializer.errors) # Debug print
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# views.py - Add these update views

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
# from .models import Course, CourseContent, PDFContent, VideoContent, QCM, QCMOption
# from .serializers import PDFContentSerializer, VideoContentSerializer

class UpdatePDFContentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, course_id, content_id):
        try:
            course = get_object_or_404(Course, id=course_id)
            
            # Check if user is course creator
            if course.creator != request.user:
                return Response(
                    {'error': 'You are not authorized to update this content'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            content = get_object_or_404(CourseContent, id=content_id, module__course=course)
            pdf_content = get_object_or_404(PDFContent, course_content=content)
            
            serializer = PDFContentSerializer(
                pdf_content, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                # Update the main content
                content.title = request.data.get('title', content.title)
                content.caption = request.data.get('caption', content.caption)
                content.order = request.data.get('order', content.order)
                content.save()
                
                serializer.save()
                
                return Response({
                    'message': 'PDF content updated successfully',
                    'content': serializer.data
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpdateVideoContentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, course_id, content_id):
        try:
            course = get_object_or_404(Course, id=course_id)
            
            # Check if user is course creator
            if course.creator != request.user:
                return Response(
                    {'error': 'You are not authorized to update this content'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            content = get_object_or_404(CourseContent, id=content_id, module__course=course)
            video_content = get_object_or_404(VideoContent, course_content=content)
            
            serializer = VideoContentSerializer(
                video_content, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                # Update the main content
                content.title = request.data.get('title', content.title)
                content.caption = request.data.get('caption', content.caption)
                content.order = request.data.get('order', content.order)
                content.save()
                
                serializer.save()
                
                return Response({
                    'message': 'Video content updated successfully',
                    'content': serializer.data
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpdateQCMContentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, course_id, content_id):
        try:
            course = get_object_or_404(Course, id=course_id)
            
            # Check if user is course creator
            if course.creator != request.user:
                return Response(
                    {'error': 'You are not authorized to update this content'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            content = get_object_or_404(CourseContent, id=content_id, module__course=course)
            qcm_content = get_object_or_404(QCM, course_content=content)
            
            serializer = QCMSerializer(
                qcm_content, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                # Update the main content
                content.title = request.data.get('title', content.title)
                content.caption = request.data.get('caption', content.caption)
                content.order = request.data.get('order', content.order)
                content.save()
                
                # Update QCM options
                if 'qcm_options' in request.data:
                    # Delete existing options
                    QCMOption.objects.filter(qcm=qcm_content).delete()
                    
                    # Create new options
                    for option_data in request.data['qcm_options']:
                        QCMOption.objects.create(
                            qcm=qcm_content,
                            text=option_data['text'],
                            is_correct=option_data['is_correct']
                        )
                
                serializer.save()
                
                return Response({
                    'message': 'QCM content updated successfully',
                    'content': serializer.data
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
