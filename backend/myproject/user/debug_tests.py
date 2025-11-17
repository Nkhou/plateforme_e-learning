# debug_tests.py - Create this as a separate file to test imports

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

# Add your project to Python path
sys.path.append('/home/nkh/plateforme_e-learning/backend/myproject')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')  # Adjust as needed
django.setup()

def test_imports():
    """Test all imports to find the problematic one"""
    print("Testing imports...")
    
    try:
        print("✓ Django imports working")
        
        # Test model imports
        from django.contrib.auth import get_user_model
        User = get_user_model()
        print("✓ User model imported")
        
        # Test your app imports - adjust based on your actual app structure
        try:
            from user.models import Course
            print("✓ Course model imported from user.models")
        except ImportError as e:
            print(f"✗ Course import failed: {e}")
            # Try alternative import paths
            try:
                from courses.models import Course  # If it's in a courses app
                print("✓ Course model imported from courses.models")
            except ImportError:
                print("✗ Could not import Course from courses.models either")
        
        # Test if Course has subscribers field
        try:
            course = Course.objects.first()
            if course and hasattr(course, 'subscribers'):
                print("✓ Course model has subscribers field")
            else:
                print("✗ Course model missing subscribers field")
        except Exception as e:
            print(f"! Could not test subscribers field: {e}")
            
        # Test URL imports
        try:
            from django.urls import reverse
            # Test if our URLs exist
            try:
                url = reverse('course-subscribe', kwargs={'pk': 1})
                print(f"✓ course-subscribe URL exists: {url}")
            except:
                print("✗ course-subscribe URL not found")
                
        except ImportError as e:
            print(f"✗ URL import failed: {e}")
            
    except Exception as e:
        print(f"✗ Import test failed: {e}")
        import traceback
        traceback.print_exc()

def check_model_structure():
    """Check the actual model structure"""
    try:
        from user.models import Course
        
        print("\n=== MODEL STRUCTURE ===")
        # Get a course or create one for testing
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user, created = User.objects.get_or_create(
            username='debug_user',
            defaults={'email': 'debug@test.com'}
        )
        
        course, created = Course.objects.get_or_create(
            title_of_course='Debug Course',
            defaults={'creator': user, 'description': 'Debug course'}
        )
        
        print("Course fields:", [f.name for f in course._meta.get_fields()])
        
        if hasattr(course, 'subscribers'):
            print("✓ Course has subscribers field")
            print("Subscribers field type:", type(course.subscribers))
            
            # Test basic operations
            initial_count = course.subscribers.count()
            print(f"Initial subscriber count: {initial_count}")
            
            # Test add
            course.subscribers.add(user)
            after_add = course.subscribers.count()
            print(f"After adding user: {after_add}")
            
            # Test remove
            course.subscribers.remove(user)
            after_remove = course.subscribers.count()
            print(f"After removing user: {after_remove}")
            
        else:
            print("✗ Course does NOT have subscribers field")
            print("Available many-to-many fields:", [
                f.name for f in course._meta.get_fields() 
                if hasattr(f, 'many_to_many') and f.many_to_many
            ])
            
    except Exception as e:
        print(f"Model structure check failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_imports()
    check_model_structure()

# Run this with: python debug_tests.py