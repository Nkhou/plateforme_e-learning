from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

class IsSuperUser(IsAdminUser):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

class FinancialReportsView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        # Monthly revenue statistics
        revenue_data = self.get_revenue_stats()
        
        # Course revenue performance
        course_revenue = self.get_course_revenue()
        
        return Response({
            'revenue_stats': revenue_data,
            'course_revenue': course_revenue
        })
    
    def get_revenue_stats(self):
        # Placeholder for revenue data
        return {
            'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'data': [1200, 1900, 1500, 2100, 1800, 2200]
        }
    
    def get_course_revenue(self):
        # Placeholder for course revenue data
        return {
            'labels': ['Course A', 'Course B', 'Course C', 'Course D'],
            'data': [500, 300, 200, 400]
        }

class SystemHealthView(APIView):
    permission_classes = [IsSuperUser]
    
    def get(self, request):
        # System performance metrics
        system_metrics = {
            'database_size': self.get_database_size(),
            'active_sessions': self.get_active_sessions(),
            'server_uptime': self.get_server_uptime(),
            'error_rate': self.get_error_rate()
        }
        
        return Response({
            'system_metrics': system_metrics,
            'performance_stats': self.get_performance_stats()
        })
    
    def get_database_size(self):
        # Placeholder for database size calculation
        return "2.5 GB"
    
    def get_active_sessions(self):
        # Get active user sessions
        from django.contrib.sessions.models import Session
        return Session.objects.count()
    
    def get_server_uptime(self):
        # Placeholder for server uptime
        return "15 days, 3 hours"
    
    def get_error_rate(self):
        # Placeholder for error rate calculation
        return "0.2%"
    
    def get_performance_stats(self):
        # API response time statistics
        return {
            'labels': ['Auth', 'Courses', 'Content', 'QCM'],
            'data': [120, 250, 180, 300]  # response times in ms
        }