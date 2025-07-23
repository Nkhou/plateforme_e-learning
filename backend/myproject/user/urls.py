from django.urls import path
from .views import UserView, Login 

urlpatterns = [
    path('user/<int:pk>/', UserView.as_view(), name='user-detail'),
    path('login/', Login.as_view(), name='login')
]