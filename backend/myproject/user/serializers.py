from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = '__all__'

    def create(self, validated_data):
        # Create a new user instance with provided data
        user = CustomUser.objects.create(
            FirstName=validated_data.get('FirstName'),
            LastName=validated_data.get('LastName'),
            email=validated_data.get('email'),
            password=validated_data.get('password'),
        )
        return user
