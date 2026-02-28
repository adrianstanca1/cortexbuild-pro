FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install || true
COPY . .
RUN npm run build || true

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
