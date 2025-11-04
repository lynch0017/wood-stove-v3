FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Railway will set the PORT env variable)
EXPOSE 5000

# Start the application with gunicorn
CMD gunicorn stove_chat_app:app --bind 0.0.0.0:$PORT

