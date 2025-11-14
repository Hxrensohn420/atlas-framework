FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY axiom-api.js /usr/share/nginx/html/
COPY axiom-dashboard.html /usr/share/nginx/html/
COPY data/ /usr/share/nginx/html/data/
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

