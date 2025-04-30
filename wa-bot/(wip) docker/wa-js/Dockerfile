FROM node:14-slim

# Install dependencies and Chrome
RUN apt-get update && apt-get install -y \
    wget gnupg curl ca-certificates \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
    libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils \
    libgbm1 libxshmfence1 libu2f-udev \
    --no-install-recommends

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install puppeteer (tanpa Chromium karena kita pakai Chrome)
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install -g puppeteer nodemon

# Buat user non-root
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Set workdir
WORKDIR /app

# Salin dependensi
COPY package*.json ./
RUN npm install

# Salin semua source
COPY . .

# Jalankan sebagai user non-root (opsional)
USER pptruser

# Jalankan aplikasi
CMD ["nodemon", "index.js"]
