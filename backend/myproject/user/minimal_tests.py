# minimal_tests.py - Create this as user/minimal_tests.py
# This will help us isolate the import issue

from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class MinimalSubscriptionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            email='test@example.com'
        )

    def test_basic_import(self):
        """Test basic imports work"""
        print("Basic test running...")
        
        # Try to import Course model
        try:
            from .models import Course
            print("✓ Course imported successfully")
            
            # Create a course
            course = Course.objects.create(
                title_of_course='Test Course',
                creator=self.user,
                description='Test description'
            )
            print("✓ Course created successfully")
            
            # Check for subscribers field
            if hasattr(course, 'subscribers'):
                print("✓ Course has subscribers field")
                
                # Test subscription
                initial_count = course.subscribers.count()
                course.subscribers.add(self.user)
                after_add = course.subscribers.count()
                
                print(f"Subscription test: {initial_count} -> {after_add}")
                self.assertEqual(after_add, initial_count + 1)
                
                # Test unsubscription
                course.subscribers.remove(self.user)
                after_remove = course.subscribers.count()
                
                print(f"Unsubscription test: {after_add} -> {after_remove}")
                self.assertEqual(after_remove, initial_count)
                
                print("✓ Basic subscription/unsubscription works")
                
            else:
                print("✗ Course missing subscribers field")
                self.fail("Course model needs subscribers field")
                
        except ImportError as e:
            print(f"✗ Import failed: {e}")
            self.fail(f"Could not import models: {e}")
        except Exception as e:
            print(f"✗ Test failed: {e}")
            import traceback
            traceback.print_exc()
            self.fail(f"Test execution failed: {e}")

# Run this with: python manage.py test user.minimal_tests -v 2