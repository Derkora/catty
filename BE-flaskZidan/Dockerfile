FROM python:3.12.3

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY chatit.py .
COPY convertit.py .
COPY templates/ ./templates/

# Create data directories
RUN mkdir -p \
    markdown/mahasiswa \
    markdown/umum \
    original \
    mahasiswachroma \
    umumchroma

ENV PORT=5000
EXPOSE 5000

CMD ["python", "app.py"]