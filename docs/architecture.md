# Architecture

HomeStream runs as a three-container stack behind an unprivileged Nginx reverse proxy:

```text
Client (Web / Android / TV / Cast)
        │
        ▼ :3000
┌──────────────────────────────┐
│  homestream-gateway (Nginx)  │
└──────┬───────────────┬───────┘
       │ /api/*        │ /*
       ▼ :3001         ▼ :3002
┌──────────────┐ ┌─────────────┐
│   backend    │ │     web     │
│  Node.js 22  │ │ Next.js 15  │
│  SQLite      │ └─────────────┘
│  FFmpeg/VAAPI│
└──────────────┘
```

## Components

- **Gateway (`nginx.conf`)**: Exposes port `3000`, forwards `/api/*` to `backend:3001` (with streaming/buffering disabled for HLS & media streams) and UI routes to `web:3002`.
- **Backend (`homestream-backend`)**:
  - SQLite (`homestream.sqlite`) stores native media items, seasons, episodes, files, watch history, profiles, music library/playlists, and downloads.
  - Native Media Engine scans `/movies` and `/tv`, fetches TMDB metadata/certifications/episode names, and generates Trickplay sprite sheets (`-skip_frame nokey`).
  - FFmpeg HLS transcoder uses `/dev/dri/renderD128` (`h264_vaapi` with `-rc_mode CQP -qp 21`) and keeps sessions alive on `/api/playback/progress` heartbeats.
- **Web (`homestream-web`)**: Next.js 15 App Router UI with `hls.js` playback, Trickplay hover previews, Music player, EPUB/PDF book reader, and Admin settings.
- **Android & TV (`homestream-android`)**: Native Kotlin app consuming the generated contract (`api/mobile/v1/*`) with Media3 ExoPlayer.
