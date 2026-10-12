# syntax=docker/dockerfile:1

FROM nginx:1.30-alpine

RUN apk add --no-cache openssl \
 && rm /etc/nginx/conf.d/default.conf

COPY templates/ /etc/nginx/templates/

COPY --chmod=755 40-generate-self-signed-cert.sh /docker-entrypoint.d/