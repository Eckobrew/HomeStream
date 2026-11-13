# HomeStream Integrations Guide

HomeStream seamlessly connects to your existing self-hosted media and download ecosystem.

---

## 🎬 Jellyfin Media Server

HomeStream uses Jellyfin as its primary media source of truth, synchronizing user accounts, libraries, watched states, audio/subtitle tracks, and resume ticks.

### Configuration
1. Open your Jellyfin Web Dashboard.
2. Go to **Dashboard** -> **Advanced** -> **API Keys**.
3. Click **+** (Add) and enter `HomeStream` as the application name.
4. Copy the generated API key.
5. In `.env`:
   ```env
   JELLYFIN_URL=http://192.168.1.50:8096
   JELLYFIN_API_KEY=your_key_here
   ```

---

## 🍿 Jellyseerr / Overseerr & TMDB

Provides high-resolution movie and TV show discovery, trending lists, and automated 1-click requests.

### Configuration
1. Get a free TMDB API Key from [TheMovieDatabase](https://www.themoviedb.org/settings/api).
2. Retrieve your Jellyseerr/Overseerr API Key from **Settings** -> **General** -> **API Key**.
3. In `.env`:
   ```env
   TMDB_API_KEY=your_tmdb_key_here
   SEERR_URL=http://192.168.1.50:5055
   SEERR_API_KEY=your_seerr_key_here
   ```

---

## 📺 Arr Stack (Sonarr & Radarr)

Automates downloading requested shows and movies directly into your library.

### Configuration
1. In Sonarr (**Settings** -> **General** -> **API Key**):
   ```env
   SONARR_URL=http://192.168.1.50:8989
   SONARR_API_KEY=your_sonarr_key
   ```
2. In Radarr (**Settings** -> **General** -> **API Key**):
   ```env
   RADARR_URL=http://192.168.1.50:7878
   RADARR_API_KEY=your_radarr_key
   ```

---

## 🎵 Soulseek / slskd & Music Hub

The Music Hub allows personal, per-profile album collection, streaming, and automated downloads via peer-to-peer Soulseek integration (`slskd`).

### Features:
- **Per-Profile Libraries**: Nathan, Kids, or Guest profiles maintain independent music catalogs.
- **Instant Server-Side Adding**: If an album has already been downloaded by another user on the server, searching and adding it occurs immediately without re-downloading.
- **Embedded Artwork Extraction**: High-res album covers are automatically extracted from audio track ID3 tags or fetched via the iTunes Search API.

### Configuration
```env
SLSKD_URL=http://192.168.1.50:5030
SLSKD_API_KEY=your_slskd_key_here
MUSIC_PATH=/mnt/music
```

---

## 🔴 YouTube Hub & Background Archiver

The YouTube Hub integrates live YouTube searching, continuous feeds, subscription notifications, and automated background downloading to your local NAS via `yt-dlp`.

### Features:
- Feed recommendations are cached in memory.
- Native video playback without ads.
- Automated background queue and local archive downloads stored under `YOUTUBE_PATH`.

### Configuration
```env
YOUTUBE_PATH=/mnt/youtube
```

---

## ⚡ qBittorrent (Direct In-Progress Streaming)

Allows streaming video files sequentially while they are actively downloading.

### Configuration
```env
QBITTORRENT_URL=http://192.168.1.50:8080
QBITTORRENT_USERNAME=admin
QBITTORRENT_PASSWORD=your_password
DOWNLOADS_PATH=/mnt/downloads
```


## Bookshelf

Configure the Bookshelf URL and API key in Admin integrations or through `BOOKSHELF_URL` and `BOOKSHELF_API_KEY`. Bookshelf tracks requests and imports completed files into its library. Mount that library at `/books` in the backend. The download staging folder serves the download client.

Books Hub offers Shelf, Search, and Queue. Open an imported EPUB or PDF to read it. Turn pages by tapping the paper edge, swiping, or using the arrow keys. Web fits one page on narrow screens and a spread where space permits. The reader saves progress to the active profile.
