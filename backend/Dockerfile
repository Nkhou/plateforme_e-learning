# backend/Dockerfile
FROM python:3.11-bullseye

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV DJANGO_SETTINGS_MODULE=myproject.settings

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# DEBUG: Show structure
RUN echo "=== Project structure ===" && \
    ls -la && \
    echo "=== myproject contents ===" && \
    ls -la myproject/

# We DON'T need to move anything! The structure is correct.
# Django expects: /app/myproject/manage.py and /app/myproject/myproject/settings.py

# Verify essential files exist
RUN if [ ! -f "myproject/manage.py" ]; then \
    echo "ERROR: manage.py not found!"; ls -la; exit 1; \
    else echo "SUCCESS: manage.py found"; fi

RUN if [ ! -f "myproject/myproject/settings.py" ]; then \
    echo "ERROR: settings.py not found!"; find . -name "settings.py"; exit 1; \
    else echo "SUCCESS: settings.py found"; fi

# Change to the project directory
WORKDIR /app/myproject

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]