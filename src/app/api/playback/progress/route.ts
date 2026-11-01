import { withParentalControls } from '@/lib/parental-controls';
import { withJellyfinSession } from '@/lib/jellyfin-session';
import { NextRequest, NextResponse } from 'next/server';
import { JellyfinClient } from '@/lib/jellyfin';
import { resolveJellyfinUserId } from '@/lib/profiles';
import { readSession } from '@/lib/session';
import { isRequestLocalOrTailscale } from '@/lib/network';

export const dynamic = 'force-dynamic';

async function handlePOST(request: NextRequest) {
  try {
    const text = await request.text();
    if (!text) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    let body;
    try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'JSON object required' }, { status: 400 });
    const { itemId, positionTicks, isPaused, isStopped, isStarted, userId } = body;

    if (typeof itemId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(itemId) || !Number.isSafeInteger(positionTicks) || positionTicks < 0 || [isPaused, isStopped, isStarted].some(flag => flag !== undefined && typeof flag !== 'boolean')) {
      return NextResponse.json({ error: 'Valid itemId, positionTicks and playback flags required' }, { status: 400 });
    }

    const session = await readSession(request.cookies.get('homeflix_session')?.value, 'web');
    const profileId = session && !(await isRequestLocalOrTailscale(request)).isLocalOrTailscale ? session.id : userId || request.cookies.get('homeflix_profile_id')?.value;
    const targetUserId = await resolveJellyfinUserId(profileId);
    const jellyfin = new JellyfinClient(undefined, undefined, targetUserId);
    if (!jellyfin.isConfigured()) {
      return NextResponse.json({ success: false, error: 'Jellyfin not configured' }, { status: 503 });
    }

    const success = isStarted ? await jellyfin.reportPlaybackStarted(itemId, positionTicks, Boolean(isPaused))
      : isStopped ? await jellyfin.reportPlaybackStopped(itemId, positionTicks)
      : await jellyfin.reportPlaybackProgress(itemId, positionTicks, Boolean(isPaused));
    return NextResponse.json(success ? { success: true } : { success: false, error: 'Jellyfin could not save playback progress' }, { status: success ? 200 : 502 });

  } catch (err) {
    console.error('Error reporting playback progress:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const POST = withJellyfinSession(withParentalControls(handlePOST));
