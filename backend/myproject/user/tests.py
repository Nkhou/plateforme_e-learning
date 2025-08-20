from django.test import TestCase

# Create your tests here.
import tempfile
import os
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Course, ContentType, CourseContent, VideoContent, PDFContent, QCM, QCMOption

User = get_user_model()

class CourseTests(APITestCase):
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            email='test@example.com'
        )
        
        # Create second user
        self.user2 = User.objects.create_user(
            username='testuser2',
            password='testpass123',
            first_name='Test2',
            last_name='User2',
            email='test2@example.com'
        )
        
        # Create content types
        self.video_type, _ = ContentType.objects.get_or_create(name='Video')
        self.pdf_type, _ = ContentType.objects.get_or_create(name='PDF')
        self.qcm_type, _ = ContentType.objects.get_or_create(name='QCM')
        
        # Create test client and authenticate
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test files
        self.create_test_files()

    # In tests.py, update the create_test_files method:

    def create_test_files(self):
        """Create test files for upload"""
        # Create a proper test image (JPEG format)
        from PIL import Image
        import io

        # Create a simple image in memory
        image = Image.new('RGB', (100, 100), color='red')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG')
        image_bytes.seek(0)

        self.test_image = SimpleUploadedFile(
            "test_image.jpg",
            image_bytes.getvalue(),
            content_type="image/jpeg"
        )

        # Create test video
        self.test_video = SimpleUploadedFile(
            "test_video.mp4",
            b"video_content",
            content_type="video/mp4"
        )

        # Create test PDF
        self.test_pdf = SimpleUploadedFile(
            "test_document.pdf",
            b"pdf_content",
            content_type="application/pdf"
        )

    def test_create_course_without_image(self):
        """Test creating a course without an image"""
        url = reverse('course-list')
        data = {
            'title_of_course': 'Test Course',
            'description': 'This is a test course description'
        }
    
        response = self.client.post(url, data)
        print("Create course response fields:", response.data.keys())
        print("Full response:", response.data)
    
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.count(), 1)
        self.assertEqual(response.data['title_of_course'], 'Test Course')
    
        # Check for creator information (updated to match your serializer)
        creator_fields = [key for key in response.data.keys() if 'creator' in key.lower()]
        print("Creator-related fields:", creator_fields)
        
        # Check for specific creator fields
        has_creator_info = any(key in response.data for key in [
            'creator_username', 'creator_first_name', 'creator_last_name', 'creator'
        ])
        
        self.assertTrue(has_creator_info, "No creator information found in response")
        
        # Or check for specific fields if you know what they should be
        if 'creator_username' in response.data:
            self.assertEqual(response.data['creator_username'], 'testuser')
        elif 'creator' in response.data and isinstance(response.data['creator'], dict):
            self.assertEqual(response.data['creator']['username'], 'testuser')
    def test_get_course_list(self):
        """Test retrieving list of courses"""
        # Create a course first with unique title
        Course.objects.create(
            title_of_course='Unique Test Course for List',
            description='Test description',
            creator=self.user
        )

        url = reverse('course-list')
        response = self.client.get(url)
        print("Course list response structure:", type(response.data), response.data)  # DEBUG

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Handle paginated response
        if 'results' in response.data:
            # Paginated response
            courses = response.data['results']
        else:
            # Non-paginated response
            courses = response.data

        # Count only the course we just created
        unique_courses = [c for c in courses if c['title_of_course'] == 'Unique Test Course for List']
        self.assertEqual(len(unique_courses), 1)

    def test_get_specific_course(self):
        """Test retrieving a specific course"""
        course = Course.objects.create(
            title_of_course='Specific Course',
            description='Specific description',
            creator=self.user
        )
        
        url = reverse('course-detail', kwargs={'pk': course.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title_of_course'], 'Specific Course')

    def test_add_video_content_to_course(self):
        """Test adding video content to a course"""
        course = Course.objects.create(
            title_of_course='Video Course',
            creator=self.user
        )
        
        url = reverse('course-add-video-content', kwargs={'pk': course.id})
        data = {
            'title': 'Introduction Video',
            'caption': 'Learn the basics',
            'order': 1,
            'video_file': self.test_video
        }
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check if content was created
        self.assertEqual(CourseContent.objects.count(), 1)
        self.assertEqual(VideoContent.objects.count(), 1)

    def test_add_pdf_content_to_course(self):
        """Test adding PDF content to a course"""
        course = Course.objects.create(
            title_of_course='PDF Course',
            creator=self.user
        )
        
        url = reverse('course-add-pdf-content', kwargs={'pk': course.id})
        data = {
            'title': 'Study Guide',
            'caption': 'PDF guide for students',
            'order': 1,
            'pdf_file': self.test_pdf
        }
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PDFContent.objects.count(), 1)

    def test_add_qcm_content_to_course(self):
        """Test adding QCM content to a course"""
        course = Course.objects.create(
            title_of_course='QCM Course',
            creator=self.user
        )
        
        url = reverse('course-add-qcm-content', kwargs={'pk': course.id})
        data = {
            'title': 'Python Quiz',
            'caption': 'Test your knowledge',
            'order': 1,
            'question': 'What is Python?',
            'options': [
                {'text': 'A programming language', 'is_correct': True},
                {'text': 'A snake', 'is_correct': False},
                {'text': 'A car brand', 'is_correct': False}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QCM.objects.count(), 1)
        self.assertEqual(QCMOption.objects.count(), 3)

    def test_get_my_courses(self):
        """Test retrieving current user's courses"""
        # Create courses for different users
        Course.objects.create(title_of_course='My Course 1', creator=self.user)
        Course.objects.create(title_of_course='My Course 2', creator=self.user)
        Course.objects.create(title_of_course='Other Course', creator=self.user2)
        
        url = reverse('course-my-courses')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should only see user's courses

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot create courses"""
        self.client.logout()
        
        url = reverse('course-list')
        data = {'title_of_course': 'Unauthorized Course'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_course_image(self):
        """Test updating course image"""
        course = Course.objects.create(
            title_of_course='Course to Update',
            creator=self.user
        )
        
        url = reverse('course-update-course-image', kwargs={'pk': course.id})
        data = {'image': self.test_image}
        
        response = self.client.patch(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('image' in response.data)

    def test_course_str_representation(self):
        """Test course string representation"""
        course = Course.objects.create(
            title_of_course='Test Course',
            creator=self.user
        )
        
        self.assertEqual(str(course), 'Test Course by Test')

class ContentTypeTests(TestCase):
    def test_content_type_creation(self):
        """Test content type creation"""
        content_type = ContentType.objects.create(name='TestType')
        self.assertEqual(str(content_type), 'TestType')

class SubscriptionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.course = Course.objects.create(
            title_of_course='Subscription Test',
            creator=self.user
        )

    def test_subscribe_to_course(self):
        """Test subscribing to a course"""
        url = reverse('course-subscribe', kwargs={'pk': self.course.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        if hasattr(self.course, 'subscribers'):
            self.assertEqual(self.course.subscribers.count(), 1)
        elif hasattr(self.course, 'course_subscriptions'):
            active_count = self.course.course_subscriptions.filter(is_active=True).count()
            self.assertEqual(active_count, 1)

    # In tests.py, add more detailed debugging:
    # Add this debug method to see what fields your Course model has
    def test_debug_subscription_model(self):
        """Debug to see what subscription system we're using"""
        print("Course fields:", [f.name for f in self.course._meta.get_fields()])

        # Check if we have direct ManyToMany or through model
        if hasattr(self.course, 'subscribers'):
            print("Using direct ManyToMany field: subscribers")
            print("Subscribers count:", self.course.subscribers.count())
        elif hasattr(self.course, 'course_subscriptions'):
            print("Using through model: course_subscriptions")
            from .models import Subscription
            active_count = self.course.course_subscriptions.filter(is_active=True).count()
            total_count = self.course.course_subscriptions.count()
            print(f"Active subscriptions: {active_count}, Total: {total_count}")

    def test_unsubscribe_from_course(self):
        """Test unsubscribing from a course"""
        print("=== DEBUG UNSUBSCRIBE ===")

        # Use the through model (Subscription) instead of direct ManyToMany
        from .models import Subscription

        # Subscribe using the through model
        subscription, created = Subscription.objects.get_or_create(
            user=self.user, 
            course=self.course, 
            defaults={'is_active': True}
        )

        initial_active = Subscription.objects.filter(course=self.course, is_active=True).count()
        print(f"Initial active subscriptions: {initial_active}")

        # Check if user is subscribed
        is_subscribed = Subscription.objects.filter(
            user=self.user, course=self.course, is_active=True
        ).exists()
        print(f"User subscribed before unsubscribe: {is_subscribed}")

        # Call unsubscribe
        url = reverse('course-unsubscribe', kwargs={'pk': self.course.id})
        response = self.client.post(url)
        print(f"Unsubscribe response: {response.status_code}, {response.data}")

        # Check status after unsubscribe
        final_active = Subscription.objects.filter(course=self.course, is_active=True).count()
        is_still_subscribed = Subscription.objects.filter(
            user=self.user, course=self.course, is_active=True
        ).exists()

        print(f"Final active subscriptions: {final_active}")
        print(f"User still subscribed after unsubscribe: {is_still_subscribed}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(final_active, initial_active - 1)
        self.assertFalse(is_still_subscribed)    
    # Factory functions for creating test data
    def create_test_course(user, title="Test Course", with_image=False):
        """Factory to create test course"""
        course_data = {
            'title_of_course': title,
            'description': f'Description for {title}',
            'creator': user
        }

        if with_image:
            course_data['image'] = SimpleUploadedFile(
                f"{title.replace(' ', '_')}.jpg",
                b"image_content",
                content_type="image/jpeg"
            )

        return Course.objects.create(**course_data)

    def create_test_video_content(course, title="Test Video"):
        """Factory to create test video content"""
        content_type, _ = ContentType.objects.get_or_create(name='Video')

        course_content = CourseContent.objects.create(
            course=course,
            content_type=content_type,
            title=title,
            caption=f'Caption for {title}',
            order=1
        )

        VideoContent.objects.create(
            course_content=course_content,
            video_file=SimpleUploadedFile(
                "test_video.mp4",
                b"video_content",
                content_type="video/mp4"
            )
        )

        return course_content