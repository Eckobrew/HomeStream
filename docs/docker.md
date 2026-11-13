# Docker & Docker Compose Setup Guide

Deploy HomeStream on any Linux server, NAS (Synology, TrueNAS, Unraid), or virtual machine using Docker Compose.

---

## 🚀 Quick Start with Docker Compose

### 1. Download Configuration Files

Create an application directory and fetch the official Compose and Nginx files:

```bash
mkdir -p homestream && cd homestream

curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/nginx.conf -o nginx.conf
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/.env.example -o .env
```

### 2. Configure Environment Variables

Edit `.env` and fill in your media server details and secrets:

```bash
nano .env
```

Essential variables to set:
```env
# Server Port
PORT=3000

# Jellyfin Server
JELLYFIN_URL=http://192.168.1.50:8096
JELLYFIN_API_KEY=your_jellyfin_api_key_here

# Security Secrets (generate via `openssl rand -hex 32`)
HOMESTREAM_MOBILE_TOKEN=generate_random_32_characters_here
HOMESTREAM_SESSION_SECRET=generate_random_32_characters_here

# Persistent Host Mounts
DATA_PATH=./data
DOWNLOADS_PATH=/mnt/downloads
MUSIC_PATH=/mnt/music
BOOKS_PATH=./books
YOUTUBE_PATH=/mnt/youtube
```

### 3. Launch the Stack

Start all containers in detached mode:

```bash
docker compose up -d
```

Check the health status of the services:

```bash
docker compose ps
```

All services (`homestream-gateway`, `homestream-backend`, `homestream-web`) should report `healthy`.

---

## 🖥️ Hardware Acceleration (Intel QuickSync / VA-API / NVIDIA)

### Intel iGPU / VA-API
Ensure your user or container runtime has access to `/dev/dri`:
```yaml
devices:
  - /dev/dri:/dev/dri
```
Ensure permissions on host:
```bash
chmod 666 /dev/dri/renderD128 /dev/dri/card*
```

### NVIDIA GPU
Add NVIDIA container runtime environment and reservations to the `backend` service in `docker-compose.yml`:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu, video]
```

---

## Books and release images

Set `BOOKS_PATH` to the host directory where Bookshelf imports completed books. Compose mounts it read-only at `/books` in HomeStream. Set `BOOKSHELF_URL` and `BOOKSHELF_API_KEY` for catalog access. See [Bookshelf setup](integrations.md#bookshelf).

Compose pins the Backend and Web release images. For upgrades, check both component releases and update Compose or set `HOMESTREAM_BACKEND_IMAGE` and `HOMESTREAM_WEB_IMAGE` in `.env` before pulling.

## 🔄 Management Commands

- **View Live Logs**:
  ```bash
  docker compose logs -f
  ```
- **Restart Services**:
  ```bash
  docker compose restart
  ```
- **Update to Latest Images**:
  ```bash
  docker compose pull
  docker compose up -d --remove-orphans
  ```
