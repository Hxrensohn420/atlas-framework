FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY axiom-api.js /usr/share/nginx/html/
COPY axiom-dashboard.html /usr/share/nginx/html/    # ← NEU
COPY data/ /usr/share/nginx/html/data/              # ← NEU (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf   
RUN chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /usr/share/nginx/html/*
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]