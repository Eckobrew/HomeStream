# HomeStream

Self-hosted streaming platform for Movies, TV Shows, Music, Books, and YouTube across Web, Android, Android TV, and Chromecast.

## Repositories

| Component | Repository | Description |
| :--- | :--- | :--- |
| **Umbrella / Deploy** | [`eckobrew/homestream`](https://github.com/Eckobrew/homestream) | Docker Compose stack, Nginx gateway, Proxmox VE LXC installer, and documentation |
| **Backend** | [`eckobrew/homestream-backend`](https://github.com/Eckobrew/homestream-backend) | Node.js 22 API, SQLite state, Native Media Engine, FFmpeg VA-API CQP transcoder, OpenAPI/Kotlin contract |
| **Web UI** | [`eckobrew/homestream-web`](https://github.com/Eckobrew/homestream-web) | Next.js 15 responsive Web & TV UI with `hls.js` player, Trickplay previews, Music, Books, Admin |
| **Android & TV** | [`eckobrew/homestream-android`](https://github.com/Eckobrew/homestream-android) | Native Kotlin + Jetpack Compose / Media3 app for Android phones, tablets, and Android TV |

## Features

- **Native Media Engine**: Scans `/movies` and `/tv` directly, matches titles/seasons/episodes/ratings with TMDB, detects multi-version files, and generates keyframe-only Trickplay VTT sprite sheets.
- **Hardware Transcoding**: Intel/AMD VA-API (`h264_vaapi` in CQP mode `-rc_mode CQP -qp 21`) with automatic software fallback, bitmap subtitle burn-in (PGS/VobSub), and active playback keepalive.
- **Music & Playlists**: Soulseek (`slskd`) album/track downloads with configurable audio quality (`MP3 320kbps`, `FLAC`, `Any Lossless`, `Any MP3`), Spotify/Exportify playlist imports, and persistent playback controls.
- **Requests & Downloads**: Integrated Radarr & Sonarr (with live quality profile selection), qBittorrent, Bookshelf, and YouTube subscriptions/downloads.
- **Multi-Profile & Parental Controls**: Local profiles with Kids mode restrictions, PIN-protected admin endpoints, signed session cookies, and watch-history tracking.

## Quick Start (Proxmox VE LXC)

Run inside your Proxmox VE host shell:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Eckobrew/homestream/main/ct/homestream.sh)"
```

Inside the LXC container, update anytime with:

```bash
homestream-update
```

See [docs/proxmox-lxc.md](docs/proxmox-lxc.md) for GPU passthrough (`/dev/dri`), media mounts, and update details.

## Quick Start (Docker Compose)

```bash
cp .env.example .env
# Edit .env with your secrets and media paths
docker compose pull
docker compose up -d
```

HomeStream is served on `http://<host>:3000`.

## Documentation

- [Architecture](docs/architecture.md)
- [Proxmox VE LXC & Updates](docs/proxmox-lxc.md)
- [Integrations & Quality Settings](docs/integrations.md)
