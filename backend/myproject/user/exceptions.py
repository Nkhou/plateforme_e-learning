# exceptions.py
from rest_framework.views import exception_handler
from rest_framework.exceptions import AuthenticationFailed
from django.http import JsonResponse

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if isinstance(exc, AuthenticationFailed) and 'Token expired' in str(exc):
        # Delete the expired token cookie
        response = JsonResponse({'error': 'Token expired'}, status=401)
        response.delete_cookie('accessToken')
    
    return response