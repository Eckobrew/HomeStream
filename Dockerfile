# ==============================================================================
# HomeStream Unified Gateway & Deployment Image
# https://github.com/Eckobrew/HomeStream
# ==============================================================================

FROM alpine:3.20 AS base

RUN apk add --no-cache \
    curl \
    nginx \
    ffmpeg \
    ca-certificates \
    libva-intel-driver \
    intel-media-driver \
    libva-utils \
    tzdata

WORKDIR /app

# Copy default gateway configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Setup runtime directories
RUN mkdir -p /data /downloads /music /youtube /run/nginx && \
    chmod 755 /data /downloads /music /youtube

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
