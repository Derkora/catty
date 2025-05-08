# Build stage
FROM node:20 AS build

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Production stage
FROM nginx:alpine

# Salin hasil build ke folder publik nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Salin konfigurasi nginx (opsional, default-nya sudah cukup)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
