<div align="center">

# 🎬 HomeStream

### Modern Self-Hosted Streaming Ecosystem

[![Proxmox VE](https://img.shields.io/badge/Proxmox_VE-LXC_Ready-E57000?logo=proxmox&logoColor=white)](docs/pve-install.md)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docs/docker.md)
[![Android](https://img.shields.io/badge/Android-Phone_%26_TV-3DDC84?logo=android&logoColor=white)](docs/mobile-api.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*A beautiful, Netflix-like media streaming companion connecting Jellyfin, Seerr, Sonarr/Radarr, Soulseek, and YouTube into a unified TV, mobile, and web experience.*

---

</div>

## Install or open HomeStream

- [Download the Android and Android TV APK](https://github.com/Eckobrew/Homestream-android/releases/latest) for Pixel and Chromecast with Google TV.
- [Deploy the server with Docker Compose](docs/docker.md) or [install on Proxmox VE](docs/pve-install.md). Then open the server address on port 3000 in your browser.
- Component release notes are available for [Web](https://github.com/Eckobrew/homestream-web/releases/latest) and [Backend](https://github.com/Eckobrew/homestream-backend/releases/latest).

## ✨ Highlights

- 🍿 **Unified Streaming Experience**: Sleek Netflix-style interface with continuous rows, hero banners, watch progress bars, and instant search.
- 📺 **Native Android Phone & TV App**: Built for Google Pixel and Android TV / Chromecast HD with dynamic floating bottom navigation, full D-pad remote support, and hardware ExoPlayer decoding.
- **Books Hub** offers per-profile shelves and an EPUB/PDF reader with cream paper and animated page turns.
- 🎵 **Dedicated Music Hub**: Spotify-styled interface with per-profile library isolation, instant server-side album adding, and automated peer-to-peer Soulseek (`slskd`) downloads.
- 🔴 **YouTube Hub**: Subscription feeds, search, and a background NAS archiver via `yt-dlp`.
- ⚡ **Hardware Acceleration**: Automatic Intel QuickSync (VA-API `/dev/dri`) and NVIDIA NVENC GPU transcoding passthrough.
- 🛡️ **Parental Controls**: Multi-profile system with age rating tiers (U, PG, 12, 15, 18) and secure Parent PIN protection.
- 📡 **Google Cast**: Integrated Chromecast receiver and sender support for effortless living room casting.

---

## ⚡ 1-Line Proxmox VE (PVE) Quick Install

Deploy HomeStream into a clean, hardware-accelerated Debian 12 LXC container by running this command in your **Proxmox VE Shell**:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/Eckobrew/HomeStream/main/ct/homestream.sh)"
```

*See the [Proxmox VE Installation Guide](docs/pve-install.md) for bind-mounts and configuration details.*

---

## 🐳 Docker Compose Deployment

Clone the configuration and launch HomeStream on any Docker host:

```bash
# Download production compose stack
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/nginx.conf -o nginx.conf
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/.env.example -o .env

# Edit environment variables
nano .env

# Start HomeStream
docker compose up -d
```

*See the [Docker Setup Guide](docs/docker.md) for full configuration options.*

---

## 🏗️ Architecture & Component Repositories

HomeStream is architected as modular microservices:

| Component | Repository | Description |
| :--- | :--- | :--- |
| **Backend** | [eckobrew/homestream-backend](https://github.com/Eckobrew/homestream-backend) | High-performance Fastify streaming engine, transcoding, *arr, slskd, and mobile API. |
| **Web UI** | [eckobrew/homestream-web](https://github.com/Eckobrew/homestream-web) | Next.js 15 standalone web app with Netflix-inspired carousels and music player. |
| **Android Client** | [eckobrew/Homestream-android](https://github.com/Eckobrew/Homestream-android) | Kotlin Android & Android TV client with adaptive hub navigation. |
| **Docs & Stack** | [eckobrew/homestream](https://github.com/Eckobrew/homestream) | Central documentation, Proxmox VE scripts, and Docker deployment configurations. |

*Detailed architecture diagram and data flows are available in [Architecture Overview](docs/architecture.md).*

---

## 📚 Documentation Index

- [Architecture & System Flow](docs/architecture.md)
- [Proxmox VE LXC Setup Guide](docs/pve-install.md)
- [Docker & Compose Guide](docs/docker.md)
- [Integrations (Jellyfin, Seerr, *arr, Soulseek, YouTube)](docs/integrations.md)
- [Android Phone & TV Setup](docs/mobile-api.md)
- [Parental Controls & PINs](docs/parental-controls.md)

---

## 📄 License

Licensed under the [MIT License](LICENSE).
