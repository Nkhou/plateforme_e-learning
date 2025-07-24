from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser

    list_display = ('username', 'FirstName', 'LastName', 'email', 'Privilege', 'is_staff')
    list_filter = ('Privilege', 'is_staff', 'is_superuser')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('FirstName', 'LastName', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Privilege Info', {'fields': ('Privilege',)}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'FirstName', 'LastName', 'email', 'password1', 'password2', 'Privilege', 'is_staff', 'is_active')}
        ),
    )

    search_fields = ('username', 'email', 'FirstName', 'LastName')
    ordering = ('username',)

admin.site.register(CustomUser, CustomUserAdmin)
