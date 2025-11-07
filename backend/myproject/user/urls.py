from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    # Authentication & User Views
    UserView, LoginView, LogoutView, CheckAuthentificationView, 
    RegisterwithoutFileView, CSVUploadView, DashboardView, CourseContentsView, CourseStudentsAPIView, CourseSubscribeAPIView,
    
    # Admin Views
    AdminDashboardView, UserManagementView, CourseStatusManagementView,
    SystemAnalyticsView, ContentManagementView, UserDetailView, SystemHealthView,CourseStatsDebugView,
    
    # Course & Subscription Views
    CourseSubscribersListViewSet, MySubscriptions, 
    
    # Module & Content Views
    ModuleDetailAPIView, ModuleListCreateAPIView,
    RecommendedCoursesView, UpdatePDFContentView, UpdateVideoContentView, 
    UpdateQCMContentView, ModuleStatusUpdateView, ContentStatusUpdateView, CourseManagementView,
    
    # QCM Views
    SubmitQCM, CourseList,
    
    # Time Tracking Views
    CourseTimeStatsView, TimeTrackingRecordView, FavoriteCourseViewSet
)
from .views import NotificationListView, NotificationMarkAsReadView, NotificationMarkAllAsReadView, NotificationUnreadCountView
# Create router for CourseViewSet
router = DefaultRouter()
router.register(r'courses/(?P<pk>\d+)/subscribers', CourseSubscribersListViewSet, basename='course-subscribers')
router.register(r'courses/favorites', views.FavoriteCourseViewSet, basename='favorite-courses')

# Define favorite course view with actions
# favorite_course_view = FavoriteCourseViewSet.as_view({
#     'get': 'list',
#     'post': 'create',
# })

urlpatterns = [
    # User endpoints
    path('user/<int:pk>/', UserView.as_view(), name='user-detail'),
    
    # Authentication endpoints
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('CheckAuthentification/', CheckAuthentificationView.as_view(), name='CheckAuthentification'),
    path('RegisterwithoutFile/', RegisterwithoutFileView.as_view(), name='RegisterwithoutFile'),
    
    # Dashboard endpoints
    path('Dashboard/', DashboardView.as_view(), name='Dashboard'),
    path('CSVUpload/', CSVUploadView.as_view(), name='CSVUpload'),

    # Course endpoints
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/mark-read/', NotificationMarkAsReadView.as_view(), name='notification-mark-read'),
    path('notifications/mark-all-read/', NotificationMarkAllAsReadView.as_view(), name='notification-mark-all-read'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('courses/', views.CourseList.as_view(), name='course-list'),
    path('courses/<int:pk>/', views.CourseDetail.as_view(), name='course-detail'),
    path('courses/my-courses/', views.MyCourses.as_view(), name='my-courses'),
    path('courses/<int:pk>/update-image/', views.CourseImageUpdate.as_view(), name='update-course-image'),
    
    # Course statistics endpoints
    path('courses/<int:pk>/statistics/', views.CourseStatisticsView.as_view(), name='course-statistics'),
    path('courses/<int:pk>/progress-overview/', views.CourseProgressOverviewView.as_view(), name='course-progress-overview'),
    path('courses/<int:pk>/qcm-performance/', views.QCMPerformanceView.as_view(), name='qcm-performance'),
    path('courses/<int:pk>/enrollment-trend/', views.EnrollmentTrendView.as_view(), name='enrollment-trend'),
    path('courses/<int:pk>/subscription-stats/', views.SubscriptionStats.as_view(), name='subscription-stats'),
    path('courses/<int:pk>/leaderboard/', views.CourseLeaderboard.as_view(), name='leaderboard'),
    
    # Time Tracking endpoints
    path('courses/<int:pk>/time-stats/', CourseTimeStatsView.as_view(), name='course-time-stats'),
    path('api/courses/<int:pk>/record-time/', TimeTrackingRecordView.as_view(), name='time-tracking-record'),
    
    # Module endpoints
    path('courses/<int:course_id>/modules/', views.ModuleListCreateAPIView.as_view(), name='module-list-create'),
    path('courses/<int:course_id>/modules/<int:module_id>/', views.ModuleDetailAPIView.as_view(), name='module-detail'),
    
    # Content endpoints
    path('courses/<int:pk>/contents/', CourseContentsView.as_view(), name='course-contents'),
    path('courses/<int:course_pk>/contents/<int:content_pk>/', views.CourseContentDetailView.as_view(), name='course-content-detail'),
    path('courses/<int:course_id>/modules/<int:module_id>/contents/pdf/', views.CreatePDFContentView.as_view(), name='create-pdf-content'),
    path('courses/<int:course_id>/modules/<int:module_id>/contents/video/', views.CreateVideoContentView.as_view(), name='create-video-content'),
    path('courses/<int:course_id>/modules/<int:module_id>/contents/qcm/', views.CreateQCMContentView.as_view(), name='create-qcm-content'),
    path('courses/<int:course_id>/modules/<int:module_id>/update-status/', 
         views.ModuleStatusUpdateView.as_view(), name='module-update-status'),
    
    # Content status management  
    path('courses/<int:course_id>/contents/<int:content_id>/update-status/', 
         views.ContentStatusUpdateView.as_view(), name='content-update-status'),
    
    # Content completion endpoints
    path('courses/<int:pk>/completeVideo/', views.MarkVideoCompletedView.as_view(), name='mark_video_completed'),
    path('courses/<int:pk>/completePdf/', views.MarkPDFCompletedView.as_view(), name='mark_pdf_completed'),
    path('courses/<int:pk>/update-status/', views.CourseStatusUpdateView.as_view(), name='course-update-status'),
    path('courses/<int:pk>/complete-content/', views.MarkContentCompletedView.as_view(), name='complete-content'),
    path('courses/<int:pk>/check-completion/', views.CheckCourseCompletionView.as_view(), name='check-completion'),
    
    # Recommended courses
    path('courses/recommended/', RecommendedCoursesView.as_view(), name='recommended-courses'),    
    
    # Subscription management
    path('courses/mysubscriptions/', views.MySubscriptions.as_view(), name='course-subscribers'),
    path('courses/my-subscriptions/', views.MySubscriptions.as_view(), name='my-subscriptions'),
    path('courses/<int:pk>/subscribers/', views.CourseSubscribersListView.as_view(), name='course-subscribers-list'),
    path('courses/<int:pk>/subscribers/', views.CourseSubscribers.as_view(), name='course-subscribers'),
    path('courses/<int:pk>/subscribe/', views.SubscribeToCourse.as_view(), name='subscribe'),
    path('courses/<int:pk>/unsubscribe/', views.UnsubscribeFromCourse.as_view(), name='unsubscribe'),
    path('courses/<int:pk>/is-subscribed/', views.CheckSubscription.as_view(), name='is-subscribed'),
    
    # path('courses/favorites/', favorite_course_view, name='favorite-course'),
    # path('courses/favorites/toggle/', FavoriteCourseViewSet.as_view({'post': 'toggle_favorite'}), name='toggle-favorite'),
    # path('courses/favorites/remove-by-course/<int:course_id>/', FavoriteCourseViewSet.as_view({'delete': 'remove_by_course'}), name='remove-favorite-by-course'),

    # Progress tracking
    path('courses/<int:pk>/update-progress/', views.UpdateProgress.as_view(), name='update-progress'),
    path('courses/<int:pk>/my-progress/', views.MyProgress.as_view(), name='my-progress'),
    path('courses/<int:pk>/qcm-progress/', views.QCMProgress.as_view(), name='qcm-progress'),
    path('courses/<int:pk>/time-calculation/', views.CourseTimeCalculationView.as_view(), name='course-time-calculation'),
    
    # Chat endpoints
    path('chat/messages/<int:user_id>/', views.ChatMessageView.as_view(), name='chat-messages'),
    path('chat/send/', views.ChatMessageView.as_view(), name='chat-send'),
    path('chat/messages/<int:message_id>/read/', views.ChatMessageView.as_view(), name='mark-message-read'),
    
    # QCM endpoints 
    path('courses/<int:pk>/submit-qcm/', views.SubmitQCM.as_view(), name='submit-qcm'),
    path('courses/<int:pk>/check-access/', views.CheckContentAccess.as_view(), name='check-access'),
    path('courses/<int:course_id>/contents/pdf/<int:content_id>/', UpdatePDFContentView.as_view(), name='update-pdf-content'),
    path('courses/<int:course_id>/contents/video/<int:content_id>/', UpdateVideoContentView.as_view(), name='update-video-content'),
    path('courses/<int:course_id>/contents/qcm/<int:content_id>/', UpdateQCMContentView.as_view(), name='update-qcm-content'),
    path('courses/', CourseManagementView.as_view(), name='courses'),
    
    # Admin endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', UserManagementView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', UserDetailView.as_view(), name='admin-user-detail'),
    path('admin/courses/', CourseStatusManagementView.as_view(), name='admin-courses'),
    path('admin/analytics/', SystemAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/contents/', ContentManagementView.as_view(), name='admin-contents'),
    path('admin/system-health/', SystemHealthView.as_view(), name='system-health'),
    path('admin/CourseList/', CourseList.as_view(), name='CourseList'),
    path('courses/<int:course_id>/students/', CourseStudentsAPIView.as_view(), name='course-students'),
    path('courses/<int:course_id>/subscribe/', CourseSubscribeAPIView.as_view(), name='course-subscribe'),
    

path('courses/<int:pk>/stats-debug/', CourseStatsDebugView.as_view(), name='course-stats-debug'),


    # Global search - FIXED (was pointing to FavoriteCourseViewSet instead of GlobalSearchView)
    path('api/search/', views.GlobalSearchView.as_view(), name='global-search'),
    path('', include(router.urls))
]
