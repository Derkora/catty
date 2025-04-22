FROM node:20

# Buat direktori kerja
WORKDIR /app

# Copy dan install dependencies
COPY package*.json ./
RUN npm install

# Copy semua source
COPY . .

# Build admin panel Strapi
RUN npm run build

# Expose port 
EXPOSE 1337

# Jalankan Strapi dalam mode production
CMD ["npm", "run", "start"]
