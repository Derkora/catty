FROM python:3.12.3

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create directories
RUN mkdir -p \
    markdown/mahasiswa \
    markdown/umum \
    original \
    mahasiswachroma \
    umumchroma \
    logs

# Copy application files (development files will be overridden by volume mount)
COPY app.py .
COPY chatit.py .
COPY convertit.py .
COPY templates/ ./templates/

ENV PORT=5000
EXPOSE 5000

# For production use Waitress, for development use Flask's server
CMD ["sh", "-c", "if [ \"$ENVIRONMENT\" = \"development\" ]; then flask run --host=0.0.0.0 --port=$PORT; else python app.py; fi"]