FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install build dependencies (for packages like numpy, chromadb, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        libffi-dev \
        libssl-dev \
        libpq-dev \
        python3-dev \
        git \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Set environment variable and expose port
ENV PYTHONPATH="${PYTHONPATH}:/app"

ENV PORT=5000
EXPOSE 5000

# Run app: use Flask in dev, Waitress in prod
CMD ["sh", "-c", "if [ \"$ENVIRONMENT\" = \"development\" ]; then flask run --host=0.0.0.0 --port=$PORT; else python app.py; fi"]
