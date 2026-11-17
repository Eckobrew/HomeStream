# Proxmox VE LXC Installation & Updates

## Create the LXC Container

Run on your Proxmox VE host:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Eckobrew/homestream/main/ct/homestream.sh)"
```

What `ct/homestream.sh` and `install/homestream-install.sh` configure:
- Debian 12 LXC with Docker Engine, Docker Compose plugin, `ffmpeg`, `vainfo`, VA-API drivers, and `yt-dlp`.
- Automatic `/dev/dri/renderD128` and `/dev/dri/card0` (or NVIDIA `/dev/nvidia*`) device passthrough when present on the PVE host.
- `/opt/homestream` with `docker-compose.yml`, `nginx.conf`, `.env` (auto-generated secrets), and directories (`data`, `movies`, `tv`, `downloads`, `music`, `books`, `youtube`).
- `homestream.service` systemd unit to start the stack on boot.
- `/usr/local/bin/homestream-update` CLI command inside the LXC.

## Updating the Stack

From inside the LXC container:

```bash
homestream-update
```

`homestream-update` backs up `.env`, pulls the latest `docker-compose.yml` and `nginx.conf`, runs `docker compose pull && docker compose up -d --remove-orphans`, prunes old images, and prints `docker compose ps`.

Or from the Proxmox host via the community-scripts updater:

```bash
pct exec <CTID> -- homestream-update
```
