from django.urls import path, include  # Add include
from rest_framework.routers import DefaultRouter
from .views import UserView, LoginView, LogoutView, CheckAuthentificationView, RegisterwithoutFileView, CSVUploadView
from .views import DashboardView, CourseContentsView  # Add CourseViewSet
from . import views

# Create router for CourseViewSet
router = DefaultRouter()
# router.register(r'courses', CourseViewSet, basename='course')

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

    # Course endpoints
    path('courses/', views.CourseList.as_view(), name='course-list'),
    path('courses/<int:pk>/', views.CourseDetail.as_view(), name='course-detail'),
    path('courses/my-courses/', views.MyCourses.as_view(), name='my-courses'),
    path('courses/<int:pk>/update-image/', views.CourseImageUpdate.as_view(), name='update-course-image'),
     # Course statistics
    path('courses/<int:pk>/statistics/', views.CourseStatisticsView.as_view(), name='course-statistics'),
    path('courses/<int:pk>/subscribers/', views.CourseSubscribersListView.as_view(), name='course-subscribers'),
    path('courses/<int:pk>/progress-overview/', views.CourseProgressOverviewView.as_view(), name='course-progress-overview'),
    path('courses/<int:pk>/qcm-performance/', views.QCMPerformanceView.as_view(), name='qcm-performance'),
    path('courses/<int:pk>/enrollment-trend/', views.EnrollmentTrendView.as_view(), name='enrollment-trend'),

    path('courses/<int:pk>/contents/', CourseContentsView.as_view(), name='course-contents'),
    path('courses/<int:course_pk>/contents/<int:content_pk>/', views.CourseContentDetailView.as_view(), name='course-content-detail'),
    path('courses/<int:pk>/contents/pdf/', views.CreatePDFContentView.as_view(), name='create-pdf-content'),
    path('courses/<int:pk>/contents/video/', views.CreateVideoContentView.as_view(), name='create-video-content'),
    path('courses/<int:pk>/contents/qcm/', views.CreateQCMContentView.as_view(), name='create-qcm-content'),
    
    # My courses
    path('courses/my-courses/', views.MyCourses.as_view(), name='my-courses'),
    # Content endpoints
    # path('courses/<int:pk>/contents/', views.CourseContents.as_view(), name='course-contents'),
    path('courses/<int:pk>/add-content/', views.AddCourseContent.as_view(), name='add-content'),
    path('courses/<int:pk>/add-video/', views.AddVideoContent.as_view(), name='add-video'),
    path('courses/<int:pk>/add-pdf/', views.AddPDFContent.as_view(), name='add-pdf'),
    path('courses/<int:pk>/add-qcm/', views.AddQCMContent.as_view(), name='add-qcm'),
    
    # Subscription endpoints
    path('courses/<int:pk>/subscribers/', views.CourseSubscribers.as_view(), name='course-subscribers'),
    path('courses/<int:pk>/subscribe/', views.SubscribeToCourse.as_view(), name='subscribe'),
    path('courses/<int:pk>/unsubscribe/', views.UnsubscribeFromCourse.as_view(), name='unsubscribe'),
    path('courses/<int:pk>/is-subscribed/', views.CheckSubscription.as_view(), name='is-subscribed'),
    path('courses/my-subscriptions/', views.MySubscriptions.as_view(), name='my-subscriptions'),
    path('courses/<int:pk>/subscription-stats/', views.SubscriptionStats.as_view(), name='subscription-stats'),
    
    # Progress endpoints
    path('courses/<int:pk>/update-progress/', views.UpdateProgress.as_view(), name='update-progress'),
    path('courses/<int:pk>/mark-completed/', views.MarkContentCompleted.as_view(), name='mark-completed'),
    path('courses/<int:pk>/leaderboard/', views.CourseLeaderboard.as_view(), name='leaderboard'),
    path('courses/<int:pk>/my-progress/', views.MyProgress.as_view(), name='my-progress'),
    
    # QCM endpoints
    path('courses/<int:pk>/submit-qcm/', views.SubmitQCM.as_view(), name='submit-qcm'),
    path('courses/<int:pk>/qcm-progress/', views.QCMProgress.as_view(), name='qcm-progress'),
    path('courses/<int:pk>/check-access/', views.CheckContentAccess.as_view(), name='check-access'),
    # path('health/', HealthCheckView.as_view(), name='health'),
    # Include course routes
    path('', include(router.urls)),  # This adds /courses/, /courses/my_courses/, etc.
]
