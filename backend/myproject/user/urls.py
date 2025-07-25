from django.urls import path
from .views import UserView, LoginView, LogoutView, CheckAuthentificationView
from .views import DashboardView

urlpatterns = [
    path('user/<int:pk>/', UserView.as_view(), name='user-detail'),
    #AUTH
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('CheckAuthentification/', CheckAuthentificationView.as_view(), name='CheckAuthentification'),
    #dashboard
    path('Dashboard/', DashboardView.as_view(), name='Dashboard'),
]