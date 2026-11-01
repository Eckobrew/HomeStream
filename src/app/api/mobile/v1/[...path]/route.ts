import { manageProfile, ProfileError, STOCK_AVATARS } from '@/lib/profile-management';
import { withJellyfinSession } from '@/lib/jellyfin-session';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GET as home } from '@/app/api/home/route';
import { GET as library } from '@/app/api/library/[type]/route';
import { GET as details } from '@/app/api/media/[id]/route';
import { GET as playback } from '@/app/api/playback/route';
import { POST as progress } from '@/app/api/playback/progress/route';
import { GET as subtitles } from '@/app/api/subtitles/route';
import { POST as requestMedia } from '@/app/api/request/route';
import { getHomeflixProfiles } from '@/lib/profiles';
import { GET as search } from '@/app/api/search/route';
import { GET as downloads } from '@/app/api/downloads/route';
import { GET as categories } from '@/app/api/categories/[type]/route';
import { GET as recommendations } from '@/app/api/media/[id]/recommendations/route';
import { GET as downloadStream } from '@/app/api/stream/download/route';
import { getServerConfig } from '@/lib/config';
import { JellyfinClient } from '@/lib/jellyfin';
import { resolveJellyfinUserId } from '@/lib/profiles';
import { createSession, readSession } from '@/lib/session';
import { allowLogin } from '@/lib/login-limit';
import { isValidDeviceToken, isLocallyPairedDeviceToken, registerDevice } from '@/lib/devices';
import { handleImage } from '@/lib/image-proxy';
import { isLocalOrTailscaleIp } from '@/lib/network';
import { SeerrClient } from '@/lib/seerr';
import { GET as trailer } from '@/app/api/trailer/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ path: string[] }> };

async function authorize(request: NextRequest): Promise<NextResponse | undefined> {
  const deviceHeader = request.headers.get('authorization') || '';
  const providedDevice = /^Bearer /i.test(deviceHeader) ? deviceHeader.slice(7) : '';
  if (isValidDeviceToken(providedDevice)) return;
  const expected = process.env.HOMESTREAM_MOBILE_TOKEN || '';
  if (expected.length < 32) {
    return NextResponse.json({ error: 'Mobile API disabled. Set HOMESTREAM_MOBILE_TOKEN to at least 32 characters.' }, { status: 503 });
  }
  const authorization = request.headers.get('authorization') || '';
  const provided = /^Bearer /i.test(authorization) ? authorization.slice(7) : '';
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if ((a.length !== b.length || !timingSafeEqual(a, b)) && !await readSession(provided, 'mobile')) {
    return NextResponse.json({ error: 'Invalid pairing token' }, { status: 401 });
  }
}

function directLocal(request: NextRequest): boolean {
  const value = request.headers.get('x-homestream-socket') || '';
  const proof = request.headers.get('x-homestream-proof') || '';
  const secret = process.env.HOMESTREAM_SESSION_SECRET || '';
  const [ip, timestamp] = value.split('|');
  if (secret.length < 32 || !ip || !isLocalOrTailscaleIp(ip) || !timestamp || Math.abs(Date.now() - Number(timestamp)) > 30000 || !/^\d+$/.test(timestamp)) return false;
  const expected = createHmac('sha256', secret).update(value).digest('hex');
  return proof.length === expected.length && timingSafeEqual(Buffer.from(proof), Buffer.from(expected));
}

async function dispatch(request: NextRequest, context: Context) {
  const params = await context.params;
  const route = params.path.join('/');
  const get = request.method === 'GET';
  if (get && route === 'discovery') {
    return NextResponse.json({ apiVersion: 1, appName: 'HomeStream', cast: true, pairing: 'local', localPairing: directLocal(request), jellyfinLogin: true });
  }
  if (get && route === 'image') return handleImage(request);
  if (get && route === 'auth/users') return NextResponse.json({ users: [] });
  if (!get && route === 'auth/login') {
    if (!allowLogin(request)) return NextResponse.json({ error: 'Too many login attempts. Try again in a minute.' }, { status: 429 });
    if ((process.env.HOMESTREAM_MOBILE_TOKEN || '').length < 32) return NextResponse.json({ error: 'Mobile API disabled' }, { status: 503 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body.username !== 'string' || !body.username.trim() || typeof body.password !== 'string') {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }
    const config = getServerConfig();
    if (!config.jellyfinUrl) return NextResponse.json({ error: 'Jellyfin is not configured' }, { status: 503 });
    const result = await fetch(`${config.jellyfinUrl}/Users/AuthenticateByName`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'MediaBrowser Client="HomeStream", Device="Android", DeviceId="homestream-android", Version="1.0"' },
      body: JSON.stringify({ Username: body.username.trim(), Pw: body.password }), signal: AbortSignal.timeout(15000),
    });
    if (!result.ok) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    const auth = await result.json();
    if (!auth.User?.Id || !auth.User?.Name) return NextResponse.json({ error: 'Invalid authentication response' }, { status: 502 });
    const user = { id: auth.User.Id, name: auth.User.Name };
    return NextResponse.json({ user, token: await createSession({ ...user, accessToken: auth.AccessToken }, 'mobile') });
  }
  if (!get && route === 'auth/pair') {
    if (!directLocal(request)) return NextResponse.json({ error: 'Automatic pairing requires a direct connection on your home network. Use Jellyfin sign-in remotely.' }, { status: 403 });
    if (!allowLogin(request)) return NextResponse.json({ error: 'Too many pairing attempts. Try again shortly.' }, { status: 429 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body.deviceId !== 'string' || !body.deviceId || body.deviceId.length > 200) return NextResponse.json({ error: 'Device identity required' }, { status: 400 });
    const externalUrl = process.env.HOMESTREAM_EXTERNAL_URL || '';
    if (!externalUrl) return NextResponse.json({ error: 'Set HOMESTREAM_EXTERNAL_URL on the server so local pairing also works away from home.' }, { status: 503 });
    const device = registerDevice(body.deviceId, typeof body.deviceName === 'string' ? body.deviceName.slice(0, 200) : 'Android', 'android', true);
    console.info('[mobile] Local device paired');
    return NextResponse.json({ token: device.token, externalUrl, serverName: 'HomeStream' });
  }
  const denied = await authorize(request);
  if (denied) return denied;
  // A Jellyfin login is bound to that user's history; a household pairing token
  // deliberately retains access to all household profiles.
  const session = await readSession(request.headers.get('authorization')?.replace(/^Bearer /i, ''), 'mobile');
  if (session) {
    const url = request.nextUrl.clone();
    url.searchParams.set('userId', session.id);
    const headers = new Headers(request.headers);
    headers.delete('cookie');
    let body: string | undefined;
    if (!get) {
      const payload = await request.json().catch(() => null);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return NextResponse.json({ error: 'JSON object required' }, { status: 400 });
      body = JSON.stringify({ ...payload, userId: session.id });
    }
    request = new NextRequest(url, { method: request.method, headers, body, signal: request.signal });
  }
  if (get && route === 'trailer') return trailer(request);
  if (get && route === 'capabilities') return NextResponse.json({ apiVersion: 1, appName: 'HomeStream', cast: true, jellyfinLogin: true });
  // Pairing tokens grant household access. Profile IDs select watch history;
  // they are not individual authentication or parental-control boundaries.
  if (get && route === 'continue-watching') {
    const uid = await resolveJellyfinUserId(session?.id || request.nextUrl.searchParams.get('userId') || undefined);
    const jellyfin = new JellyfinClient(undefined, undefined, uid);
    try { return NextResponse.json({ items: await jellyfin.getResumeItems(true) }); }
    catch { return NextResponse.json({ error: 'Resume history temporarily unavailable' }, { status: 503 }); }
  }
  if ((route === 'profiles' || route.startsWith('profiles/')) &&
      (session || !isLocallyPairedDeviceToken(request.headers.get('authorization')?.replace(/^Bearer /i, '') || ''))) {
    return NextResponse.json({ error: 'Profiles are available only on locally paired household devices' }, { status: 403 });
  }
  if (get && route === 'profiles') {
    const all = await getHomeflixProfiles();
    const profiles = session ? [all.find(p => (p.jellyfinUserId || p.id) === session.id) || { id: session.id, name: session.name, jellyfinUserId: session.id }] : all;
    return NextResponse.json({ profiles, canManage: !session, avatars: STOCK_AVATARS });
  }
  if (get && route === 'profiles/users') {
    if (session) return NextResponse.json({ error: 'Household pairing required' }, { status: 403 });
    return NextResponse.json({ users: (await new JellyfinClient().getUsers()).map(user => ({ id: user.id, name: user.name })) });
  }
  if (!get && route === 'profiles') {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Profile details required' }, { status: 400 });
    if (!allowLogin(request)) return NextResponse.json({ error: 'Too many profile changes. Try again shortly.' }, { status: 429 });
    try { return NextResponse.json({ success: true, ...await manageProfile(body, session?.id, session?.name) }); }
    catch (error) {
      if (error instanceof ProfileError) return NextResponse.json({ error: error.message }, { status: error.status });
      console.error('Could not save profile');
      return NextResponse.json({ error: 'Could not save profile. Check server storage and Jellyfin configuration.' }, { status: 500 });
    }
  }
  if (!get && route === 'watched') {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.itemId !== 'string' || !body.itemId || typeof body.played !== 'boolean') return NextResponse.json({ error: 'itemId and played required' }, { status: 400 });
    const uid = await resolveJellyfinUserId(session?.id || body.userId || undefined);
    const jellyfin = new JellyfinClient(undefined, undefined, uid);
    if (!jellyfin.isConfigured()) return NextResponse.json({ error: 'Jellyfin not configured' }, { status: 503 });
    const success = await jellyfin.setWatched(body.itemId, body.played);
    return NextResponse.json({ success }, { status: success ? 200 : 502 });
  }
  if (get && route === 'episodes') {
    const itemId = request.nextUrl.searchParams.get('itemId');
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });
    const uid = await resolveJellyfinUserId(request.nextUrl.searchParams.get('userId') || undefined);
    const jellyfin = new JellyfinClient(undefined, undefined, uid);
    if (!jellyfin.isConfigured()) return NextResponse.json({ error: 'Jellyfin not configured' }, { status: 503 });
    return NextResponse.json({ items: await jellyfin.getEpisodeQueue(itemId) });
  }
  if (get && route === 'search') {
    const q = request.nextUrl.searchParams.get('q')?.trim() || '';
    if (!q) return NextResponse.json({ results: [] });
    const config = getServerConfig();
    const libraryResults = await Promise.all(['movies', 'tv'].map(async type => {
      if (!config.jellyfinUrl || !config.jellyfinApiKey) return [];
      const url = request.nextUrl.clone(); url.searchParams.set('search', q);
      const response = await library(new NextRequest(url, { headers: request.headers }), { params: Promise.resolve({ type }) });
      return (await response.json()).items || [];
    }));
    const discovery = config.seerrUrl && config.seerrApiKey ? (await (await search(request)).json()).results || [] : [];
    const results = [...libraryResults.flat(), ...discovery];
    const seen = new Set<string>();
    return NextResponse.json({ results: results.filter(item => {
      const key = `${item.type}:${item.tmdbId || item.title.toLowerCase().trim()}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    }) });
  }
  if (get && route === 'downloads') return downloads();
  if (get && /^categories\/(movies|tv|series|requests)$/.test(route)) return categories(request, { params: Promise.resolve({ type: params.path[1] }) });
  if (get && params.path.length === 3 && params.path[0] === 'media' && params.path[2] === 'collection') {
    const id = params.path[1];
    const uid = await resolveJellyfinUserId(session?.id || request.nextUrl.searchParams.get('userId') || undefined);
    const jellyfin = new JellyfinClient(undefined, undefined, uid);
    let tmdbId = /^seerr-(?:movie-)?(\d+)$/.exec(id)?.[1] || (/^\d+$/.test(id) ? id : '');
    if (!tmdbId && jellyfin.isConfigured()) {
      const parts = await jellyfin.getMovieCollection(id);
      if (parts.length) return NextResponse.json({ collection: { name: 'Movie Collection', parts } });
      const item = await jellyfin.getItemDetails(id);
      tmdbId = item?.tmdbId ? String(item.tmdbId) : '';
    }
    const seerr = new SeerrClient();
    return NextResponse.json({ collection: tmdbId && seerr.isConfigured() ? await seerr.getMovieCollection(Number(tmdbId)) : null });
  }
  if (get && params.path.length === 3 && params.path[0] === 'media' && params.path[2] === 'recommendations') return recommendations(request, { params: Promise.resolve({ id: params.path[1] }) });
  if (get && route === 'stream/download') return downloadStream(request);
  if (get && route === 'home') return home(request);
  if (get && /^library\/(movies|tv|youtube)$/.test(route)) {
    return library(request, { params: Promise.resolve({ type: params.path[1] }) });
  }
  if (get && params.path.length === 2 && params.path[0] === 'media') {
    return details(request, { params: Promise.resolve({ id: params.path[1] }) });
  }
  if (get && route === 'playback') {
    const ticks = request.nextUrl.searchParams.get('startTimeTicks');
    if (ticks !== null && (!Number.isSafeInteger(Number(ticks)) || Number(ticks) < 0)) {
      return NextResponse.json({ error: 'Invalid startTimeTicks' }, { status: 400 });
    }
    return playback(request);
  }
  if (get && route === 'subtitles') return subtitles(request);
  if (!get && route === 'progress') {
    let body;
    try { body = await request.clone().json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'JSON object required' }, { status: 400 });
    }
    if (typeof body.itemId !== 'string' || !body.itemId ||
        !Number.isSafeInteger(body.positionTicks) || body.positionTicks < 0) {
      return NextResponse.json({ error: 'Valid itemId and nonnegative positionTicks required' }, { status: 400 });
    }
    return progress(request);
  }
  if (!get && route === 'request') return requestMedia(request);
  return NextResponse.json({ error: 'Unknown mobile endpoint' }, { status: 404 });
}

async function handle(request: NextRequest, context: Context) {
  let response: Response;
  try {
    response = await dispatch(request, context);
  } catch (error) {
    console.error('Mobile API request failed:', error);
    response = NextResponse.json({ error: 'Mobile API request failed' }, { status: 500 });
  }
  // Never cache profile history or URLs containing Jellyfin stream credentials.
  if ((await context.params).path.join('/') !== 'image') response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const GET = withJellyfinSession(handle);
export const POST = withJellyfinSession(handle);
