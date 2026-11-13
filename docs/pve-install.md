# Proxmox VE (PVE) LXC Installation Guide

Deploy HomeStream on Proxmox VE in a dedicated, lightweight, hardware-accelerated Debian 12 LXC container using the official Community Script installer.

---

## ⚡ 1-Line Quick Installation

Run this command in your **Proxmox VE Shell** (Host Console):

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/Eckobrew/HomeStream/main/ct/homestream.sh)"
```

### What the Script Automatically Does:
1. **Creates LXC Container**: Debian 12 (Bookworm) with 2 vCPUs, 2048 MB RAM, and 16 GB disk.
2. **GPU Hardware Acceleration Passthrough**:
   - Auto-detects Intel QuickSync / VA-API device (`/dev/dri/renderD128`, `/dev/dri/card0`) and grants `mode=0666` permissions.
   - Auto-detects NVIDIA GPUs (`/dev/nvidia*`) and passes them through.
3. **Installs Container Runtime**: Sets up Docker Engine, Docker Compose, `ffmpeg`, `vainfo`, and `yt-dlp`.
4. **Deploys Service Stack**:
   - Downloads production `docker-compose.yml` and `nginx.conf`.
   - Generates cryptographically secure 32-byte tokens for mobile pairing and sessions.
   - Creates a persistent systemd service (`systemctl enable --now homestream`).
5. **Initializes Services**: Pulls container images and starts the gateway, backend, and web UI.

---

## 🛠️ Post-Installation Configuration

### 1. Configure Services (`.env`)
Access the LXC console or SSH into the container:

```bash
nano /opt/homestream/.env
```

Enter your Jellyfin server details:
```env
JELLYFIN_URL=http://192.168.1.50:8096
JELLYFIN_API_KEY=your_jellyfin_api_key_here
```

Restart the stack to apply changes:
```bash
systemctl restart homestream
```

### 2. Access the Application
Open your browser and navigate to:
```
http://<CONTAINER_IP>:3000
```

---

## 🗄️ Mounting External Storage (NAS / Media Drives)

If your media library, music files, or YouTube archive are located on a NAS or Proxmox host storage, add bind mounts to the LXC configuration on the host:

Edit `/etc/pve/lxc/<CTID>.conf` on your Proxmox host:
```ini
mp0: /mnt/pve/nas/downloads,mp=/opt/homestream/downloads
mp1: /mnt/pve/nas/music,mp=/opt/homestream/music
mp2: /mnt/pve/nas/youtube,mp=/opt/homestream/youtube
mp3: /mnt/pve/nas/books,mp=/opt/homestream/books,ro=1
```

Restart the LXC container:
```bash
pct reboot <CTID>
```

---

## 🔄 Updating HomeStream

To update, check the [Docker guide](docker.md#books-and-release-images) for the release image settings, then pull the configured images:

Inside the container:
```bash
cd /opt/homestream
docker compose pull
docker compose up -d --remove-orphans
```

Or from the Proxmox host, run the script again and select **Update**.
