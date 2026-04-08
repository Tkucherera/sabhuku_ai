# nginx/Dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /dist /usr/share/nginx/html