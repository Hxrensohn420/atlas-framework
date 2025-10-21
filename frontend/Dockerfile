FROM nginx:alpine
COPY *.html *.js *.css /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /usr/share/nginx/html/*
EXPOSE 80
