# Backend audit — 1 November 2026

Scope: all API routes and the Jellyfin/Seerr/qBittorrent clients, identity/profile boundaries, Kids ratings, streaming/proxy behavior, caching and phone/TV API parity. Review is static plus compilation, dependency audit, automatic CI results and deployment logs. No live functional tests or changes to real Jellyfin accounts/policies were performed as tests. Hardware acceptance remains with the user.

## Concrete fixes

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | Missing PIN storage or an unwritable configured data directory could silently remove the Kids enforcement context. | Fail closed when Kids exist without PIN storage or configured persistent storage cannot be used; corrupt device registries are not overwritten as empty. |
| High | Restricted preview playback could return a redirect containing the household Jellyfin API key, bypassing the JSON stream wrapper. | Preview redirects now use encrypted profile-scoped stream capabilities; CI checks the redirect does not expose `api_key`. |
| High | Concurrent PIN requests could race first-PIN initialization and the failed-attempt limit. | PIN checks/initialization are serialized; subsequent initialization attempts verify the already-created PIN. |
| High | Torrent webhook mutations inherited broad route-level LAN/authenticated-user access, including non-admin users. | Require dedicated webhook bearer token or signed administrator session; reject malformed event bodies/hash values; Test and unrelated events do not mutate torrents. |
| Medium | Kids mode rejected request-quality discovery; the mobile dispatcher did not expose that GET route. | GET request options are allowed and forwarded without weakening POST title certification checks. |
| Medium | Native and legacy endpoints validated different playback/progress/subtitle inputs. | Shared legacy handlers validate safe IDs, finite nonnegative ticks, flags and subtitle indexes; subtitle reads no longer use public caching. |
| Medium | Playback progress could report success despite an upstream failure. | Start/progress/stop propagate upstream status; the API returns 502 on failure and 503 when Jellyfin is absent. |
| Medium | Library fallback GUIDs belonged to a specific installation. | Movie/TV queries use type-based discovery if views are absent; missing YouTube views return empty instead of another installation's ID or unrelated videos. |
| Medium | Phone and web searches differed; native search fetched whole libraries before filtering. | Both use one bounded Jellyfin title search plus Seerr discovery, deduplicate by type/TMDB or title/year, and prefer the local playable item. Active-download annotations no longer overwrite available Jellyfin matches. |
| Medium | Full TV-library browsing triggered per-series episode lookups. | Resolve episodes on detail/play rather than pre-resolving every series during library browsing. |
| Medium | Upstream operations could hang or issue unbounded parallel season lookups. | Jellyfin/Seerr metadata clients have timeouts and reject redirects; Seerr seasons use four concurrent lookups and a 15-second season budget. Unresolved seasons keep their metadata with empty episodes. |
| Medium | Non-library Seerr episode IDs were mistakenly treated as Jellyfin IDs in Kids filtering. | Resolve their parent TV certification, preserving eligible requestable episode metadata. |
| Medium | Next.js no longer supplies the legacy request IP property, breaking direct-LAN classification and sharing one login-limit bucket. | Verify the existing server-signed TCP-peer proof using WebCrypto before trusting the direct peer address; forwarded addresses still require explicit proxy configuration. |
| Medium | HLS size checks happened after the entire playlist was buffered; proxy errors lost range information. | Bound reads to 2 MB while streaming, cancel oversized bodies and retain upstream range/CORS headers on errors. |
| Medium | Docker and CI used end-of-life Node 20. | Move to supported Node 22, matching the local build runtime. |
| Low | Routes without a request argument were treated as the downloads endpoint by the parental wrapper. | Config/download handlers now receive their actual request. |
| Medium | Request quality fallbacks used profile IDs from another installation, including while providers were unavailable. | A Server default choice omits the quality ID and lets Seerr use its configured default; live profiles remain selectable, and stale dialog fetches are aborted. |
| High | External-login caches did not confirm Kids policy before restoration. | Added a current-session policy endpoint without exposing household profile management, and updated Android cache/startup checks for both setup modes. |
| Low | Malformed 4K/quality/server request options could be coerced into unintended settings. | Validate optional booleans and numeric IDs before submission. |
| Low | Computed library match percentages could exceed 100. | Clamp output to 0–100. |
| Low | Direct-path streaming accepted arbitrary file extensions within the downloads mount. | Require a recognized video filename; incomplete-file suffixes need hash-based streaming. |

## Feature/API parity

| Feature | Phone / TV backend support | Notes |
| --- | --- | --- |
| Local discovery, pairing, external Jellyfin login | Shared native API | Profiles remain limited to locally paired household setups, including external use after pairing. |
| Profiles, avatars, create/link account, Kids DOB/PIN | Shared native API | External login has no profile-management API. Legacy web profile UI is separate and is not an Android editor clone. |
| Home, libraries, categories, search, recommendations, collections | Shared handlers | Recommendations can include non-library content; known ratings are required for Kids. |
| Playback negotiation and native-TV capabilities | Shared API | Real decoder behavior still needs device testing. |
| Episodes, next/previous/autoplay, watched, progress | Shared API | Queue execution is client/receiver behavior; upstream progress failures are now visible. |
| Continue watching / Google TV Watch Next | Resume endpoint | Launcher publishing is Android-side and launcher-controlled. |
| Subtitles and scoped HLS/direct streams | Shared backend | Includes restricted profiles and receiver-friendly public capability URLs. |
| In-progress qBittorrent streaming | Verified-piece hash path | Intentionally disabled in Kids mode; legacy direct paths are for completed video files. |
| Custom Cast receiver | Hosted at `/cast/receiver.html` | Registered Android receiver ID `75369D0A`; idle slideshow is receiver UI rather than PHOTO playback. Registration/device propagation and hardware playback remain manual checks. |

## Verification and remaining limits

- Local TypeScript/Next compilation and Android assembly are checked; GitHub CI exercises the fake-upstream API boundary. No manual test suite or live device playback is run by the coding agent.
- `npm audit --omit=dev` reported **0 production vulnerabilities** at the time of review; this is not a guarantee against undisclosed vulnerabilities.
- Full `npm run lint` remains failing on existing repository-wide explicit-`any`, unused-variable, UI escaping and hook diagnostics. Production builds skip lint; targeted native-route lint is a separate CI check. These diagnostics have not been hidden or disabled by this audit.
- Very large libraries still return full catalogue metadata to current clients. Removing per-series work and bounding search reduces cost, but end-to-end paginated catalogue support would require coordinated client/API work.
- Kids filtering is deliberately conservative: unknown/unrated titles are excluded, and bounded certification lookups can leave discovery rows sparse while providers are slow. A birthday changes policy on the next server request, not an independent scheduled timer.
- Direct filesystem download paths cannot prove qBittorrent piece completeness. Use torrent-hash URLs for growing downloads; do not treat a preallocated filesystem length as verification.
- Explicit `HOMESTREAM_TRUST_PROXY=true` assumes the reverse proxy sanitizes forwarded headers and direct backend access is isolated appropriately. Automatic local pairing continues to require a direct, signed TCP peer.
- Webhook integrations must send `Authorization: Bearer <HOMESTREAM_WEBHOOK_TOKEN>`; never put this secret in the receiver page or Android app.
- Custom receiver publication requires HTTPS. Development HTTP is supported by Google's receiver registration rules. Public receiver assets contain no household API token.
- No claim of universal codec support, solved hardware audio sync or successful Cast launch is made without the user's device checks.


### Follow-up: remote access and playback reports (1 November)

- Production HTTP sessions previously set Secure cookies and could not persist at the configured HTTP origin; cookie security now follows the validated browser/public origin, including HTTPS upgrades. Proxy origin checks accept the configured public origin without accepting arbitrary forwarded host headers.
- The socket preload can verify a forwarding chain only from explicitly configured exact TCP proxy peers (`HOMESTREAM_TRUSTED_PROXIES`), reading from the trusted end. Local native auto-pairing still rejects proxied requests. The Proxmox subnet router uses SNAT, so its LAN address is expected instead of the originating Tailscale IP.
- Jellyfin logs confirmed API-key playback sessions with `User null`. Jellyfin ignores UserId in session-report bodies. Household progress now also persists playback fields through the explicit user-data endpoint for the resolved profile. Signed Jellyfin-login sessions retain their scoped user credentials.
- Series details choose an in-progress regular episode before the next unplayed episode. Playback negotiation exposes fresh saved ticks, avoiding stale browse progress.
- Logs confirmed copied H.264 video and EAC3-to-AAC audio in a growing MP4, source runtime 45:06. Prefer finite HLS for remux/transcode delivery and retain library runtime in outgoing custom receiver status. Direct Play remains preferred for compatible originals.

Hardware acceptance is listed in the Android TOBETESTED artifact; these changes do not constitute manual device playback or UI acceptance testing.
