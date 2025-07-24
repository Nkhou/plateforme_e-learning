from django.urls import path
from .views import UserView, LoginView, LogoutView, CheckAuthentificationView

urlpatterns = [
    path('user/<int:pk>/', UserView.as_view(), name='user-detail'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('CheckAuthentification/', CheckAuthentificationView.as_view(), name='CheckAuthentification'),
]