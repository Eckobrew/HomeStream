#!/usr/bin/env bash

# Copyright (c) 2021-2026 community-scripts ORG
# Author: Eckobrew
# License: MIT | https://github.com/community-scripts/ProxmoxVE/raw/main/LICENSE
# Source: https://github.com/Eckobrew/HomeStream

source /dev/stdin <<<"$FUNCTIONS_FILE_PATH"
color
verb_ip6
catch_errors
setting_up_container
network_check
update_os

msg_info "Installing System Dependencies"
$STD apt-get update
$STD apt-get install -y \
  curl \
  sudo \
  git \
  jq \
  ca-certificates \
  gnupg \
  ffmpeg \
  vainfo \
  va-driver-all \
  mesa-va-drivers
msg_ok "Installed System Dependencies"

msg_info "Installing Docker Engine & Docker Compose"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

$STD apt-get update
$STD apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable -q --now docker
msg_ok "Installed Docker Engine & Compose"

msg_info "Installing yt-dlp"
curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
msg_ok "Installed yt-dlp"

msg_info "Setting up HomeStream Stack"
mkdir -p /opt/homestream/data
mkdir -p /opt/homestream/downloads
mkdir -p /opt/homestream/music
mkdir -p /opt/homestream/books
mkdir -p /opt/homestream/youtube

cd /opt/homestream

# Download production docker-compose, nginx configuration and environment template
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/docker-compose.yml -o /opt/homestream/docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/nginx.conf -o /opt/homestream/nginx.conf

if [[ ! -f /opt/homestream/.env ]]; then
  curl -fsSL https://raw.githubusercontent.com/Eckobrew/HomeStream/main/.env.example -o /opt/homestream/.env
  # Generate cryptographically secure tokens automatically
  MOBILE_SECRET=$(openssl rand -hex 32)
  SESSION_SECRET=$(openssl rand -hex 32)
  SETUP_SECRET=$(openssl rand -hex 32)
  sed -i "s|^HOMESTREAM_MOBILE_TOKEN=.*|HOMESTREAM_MOBILE_TOKEN=${MOBILE_SECRET}|" /opt/homestream/.env
  sed -i "s|^HOMESTREAM_SESSION_SECRET=.*|HOMESTREAM_SESSION_SECRET=${SESSION_SECRET}|" /opt/homestream/.env
  sed -i "s|^HOMESTREAM_SETUP_TOKEN=.*|HOMESTREAM_SETUP_TOKEN=${SETUP_SECRET}|" /opt/homestream/.env
fi
chmod 600 /opt/homestream/.env
msg_ok "Configured HomeStream Environment"

msg_info "Creating Systemd Service"
cat <<EOF >/etc/systemd/system/homestream.service
[Unit]
Description=HomeStream Stack (Gateway, Fastify Backend, Web UI)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/homestream
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose pull && /usr/bin/docker compose up -d --remove-orphans
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable -q homestream
msg_ok "Created Systemd Service"

msg_info "Pulling Container Images & Starting Stack (Patience)"
cd /opt/homestream
$STD docker compose pull
$STD docker compose up -d --remove-orphans
msg_ok "Started HomeStream Stack"

motd_ssh
customize
cleanup_lxc
