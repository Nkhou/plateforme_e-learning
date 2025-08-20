from django.urls import path, include  # Add include
from rest_framework.routers import DefaultRouter
from .views import UserView, LoginView, LogoutView, CheckAuthentificationView, RegisterwithoutFileView, CSVUploadView
from .views import DashboardView, CourseViewSet  # Add CourseViewSet

# Create router for CourseViewSet
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')

urlpatterns = [
    path('user/<int:pk>/', UserView.as_view(), name='user-detail'),
    # AUTH
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('CheckAuthentification/', CheckAuthentificationView.as_view(), name='CheckAuthentification'),
    path('RegisterwithoutFile/', RegisterwithoutFileView.as_view(), name='RegisterwithoutFile'),
    # dashboard
    path('Dashboard/', DashboardView.as_view(), name='Dashboard'),
    path('CSVUpload/', CSVUploadView.as_view(), name='CSVUpload'),
    
    # Include course routes
    path('', include(router.urls)),  # This adds /courses/, /courses/my_courses/, etc.
]
