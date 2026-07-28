FROM node:20-alpine AS builder
ARG VITE_SMARTCAPTCHA_SITE_KEY
ENV VITE_SMARTCAPTCHA_SITE_KEY=${VITE_SMARTCAPTCHA_SITE_KEY}
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]