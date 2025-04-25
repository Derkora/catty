# Gunakan image Python yang lebih ringan
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir flask-cors

# Salin seluruh kode aplikasi
COPY . .

# Jalankan aplikasi menggunakan Gunicorn
CMD ["python", "app.py"]

