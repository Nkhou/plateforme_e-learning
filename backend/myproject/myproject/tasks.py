# Create a tasks.py file for testing
cat > backend/myproject/myproject/tasks.py << 'EOF'
from celery import shared_task

@shared_task
def test_task():
    return "Celery is working correctly!"
EOF