FROM node:18-slim

# Install Chrome dependencies & Chrome
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg \
    fonts-kacst fonts-freefont-ttf libxss1 \
    libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
    libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxrandr2 xdg-utils \
    --no-install-recommends \
 && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
 && apt-get update && apt-get install -y google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files first (cacheable layer)
COPY package*.json ./

# Skip Chromium download for puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install dependencies (including puppeteer from package.json)
RUN npm install

# Create user for puppeteer
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
 && mkdir -p /home/pptruser/Downloads \
 && chown -R pptruser:pptruser /home/pptruser

# Copy source code
COPY . .

# Buat folder session dan beri izin
RUN mkdir -p /app/.wwebjs_auth/session \
    && chown -R node:node /app

# Jalankan sebagai user node
USER node

# Start app
CMD ["node", "index.js"]
