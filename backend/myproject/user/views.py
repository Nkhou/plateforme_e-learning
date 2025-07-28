
# Create your views here.
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomUserSerializer  # Fixed import
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

class LoginView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            if not email or not password:
                return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
            user_obj = CustomUser.objects.filter(email=email).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)
            if user is None:
                return Response({"error": "User not found or incorrect credentials::::!!!::."}, status=status.HTTP_400_BAD_REQUEST)
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            response = Response({
                'refresh': str(refresh),
                'access': access_token,
            }, status=status.HTTP_200_OK)

            response.set_cookie(
                key='accessToken',
                value=access_token,
                httponly=True,
                secure=False,  # True in prod with HTTPS
                samesite='Lax'
            )

            return response

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"}, status=200)
        response.delete_cookie('accessToken')
        return response

class CheckAuthentificationView(APIView):
    def get(self, request):
        token = request.COOKIES.get('accessToken')
        if not token:
            return Response({
                'authenticated': False, 
                'debug': 'authenticated1', 
                'message': 'No token'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            print(token)
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return Response({
                'authenticated': True, 
                'debug': 'authenticated2', 
                'user': payload.get('user_id')
            }, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            Response({
                'authenticated': False, 
                'debug': 'authenticated3', 
                'message': 'Token expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
            Response.delete_cookie('accessToken')
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

def generate_random_password():
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(12))

from django.contrib.auth.hashers import make_password

class RegisterwithoutFileView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email', '').strip()
            firstName = request.data.get('firstName', '').strip()
            lastName = request.data.get('lastName', '').strip()
            Privilege = request.data.get('Privilege', 'AP').strip()  # Default to Apprenant
            
            print(f"Extracted values - email: {email}, firstName: {firstName}, lastName: {lastName}, Privilege: {Privilege}")  # Debug
            
            # Validate required fields
            if not all([email, firstName, lastName]):
                print("Missing required fields")  # Debug
                return Response(
                    {
                        "error": "All fields are required",
                        "missing_fields": [
                            field for field in ['email', 'firstName', 'lastName'] 
                            if not request.data.get(field)
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate credentials
            password = str(generate_random_password())  # Ensure string type
            username = f"{firstName} {lastName}".strip()

            if CustomUser.objects.filter(email=email).exists():
                return Response(
                    {"error": "Email already in use."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user_data = {
                'username': username,
                'email': email,
                'FirstName': firstName,
                'LastName': lastName,
                'Privilege': Privilege,
                'password': make_password(password)
            }
            serializer = CustomUserSerializer(data=user_data)
            if serializer.is_valid():
                user = serializer.save()
                return Response(
                    {"message": "User registered successfully"},
                    status=status.HTTP_201_CREATED
                )
            else:
                print('kfkkfkkf')
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )