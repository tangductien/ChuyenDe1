# Sử dụng image Nginx Alpine chính thức làm base image
FROM nginx:alpine

# Sao chép các file build frontend (React) vào thư mục phục vụ của Nginx
COPY . /usr/share/nginx/html

# Sao chép file cấu hình template của Nginx vào thư mục template
COPY ./default.conf.template /etc/nginx/templates/default.conf.template

# Cài đặt envsubst để thay thế các biến môi trường trong file cấu hình Nginx
RUN apk add --no-cache gettext

ENTRYPOINT []
CMD /bin/sh -c "envsubst '\$BACKEND_HOST \$BACKEND_PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"

# Mở cổng 80
EXPOSE 80
