# Integrations & Quality Settings

Configure integrations in **Admin → Modules** (`/admin`).

## Media Metadata & Playback
- **TMDB**: Required for native library metadata, episode titles, artwork, and age ratings/certifications.
- **Jellyfin** *(optional)*: Legacy fallback engine.

## Movies & TV Requests
- **Radarr** & **Sonarr**: Add URL and API key. Once connected, **Search quality profile** lists your live Radarr/Sonarr quality profiles so HomeStream requests use your chosen profile instead of defaulting to `1`.
- **qBittorrent**: Monitors active torrent downloads and maps `/downloads` inside the backend container.

## Music & Books
- **slskd (Soulseek)**: Downloads requested albums and imported playlist tracks. Configure **Search audio quality** in Admin:
  - `MP3 320kbps (Recommended)`
  - `FLAC (Lossless)`
  - `Any Lossless (FLAC / ALAC / WAV)`
  - `Any MP3 (192kbps+)`
- **Spotify** *(optional)*: Client ID & Secret for Spotify playlist imports (Exportify CSV/ZIP imports work without credentials).
- **Bookshelf**: Connects to Readarr/Bookshelf and reads from `/books`.
