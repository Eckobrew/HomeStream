# Android & Android TV Client Setup

HomeStream includes a native Android application built for smartphones (e.g., Google Pixel 8a) and Android TV / Google TV devices (e.g., Chromecast HD / Nvidia Shield).

- **Repository**: [Eckobrew/Homestream-android](https://github.com/Eckobrew/Homestream-android)
- **Minimum SDK**: Android 8.0 (API 26)
- **Target SDK**: Android 15 (API 35)

---

## 📲 Pairing Your Android Device

HomeStream supports two pairing workflows:

### 1. Automatic LAN Direct Pairing (Zero Password Setup)
When your phone or TV is on the same local network (LAN) as your HomeStream server:
1. Open the HomeStream Android app.
2. The app detects the server via mDNS/Discovery on your local subnet.
3. Tap **Connect**.
4. The server validates that the request originates from a private subnet and establishes an authenticated device session token without requiring credentials.

### 2. Remote Jellyfin Sign-In
When connecting outside your home network:
1. Enter your server's external address (e.g., `https://homestream.yourdomain.com`).
2. Sign in with your Jellyfin username and password.
3. The app establishes a persistent, secure session.

---

## 🧭 Dynamic Hub Navigation

On mobile phones, HomeStream features a floating bottom pill that dynamically adapts its controls based on the active hub:

- **Main Movies & TV Hub**: Home, TV Shows, Movies, Discover, Search (Red accent).
- **Music Hub**: Albums, Artists, Songs, Search, Player (Spotify Green `#1DB954` accent).
- **YouTube Hub**: Home, Subs, Queue, Archive, Search (YouTube Red accent).

---

## 📺 Android TV Features

On Google TV and Android TV:
- Full D-Pad / Remote control navigation with smooth focus states and card elevation.
- Dedicated TV browse menu for A–Z Movie catalogs, Series, Music Hub, and YouTube Hub.
- Hardware-accelerated ExoPlayer playback.
