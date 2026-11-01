import { NextRequest } from 'next/server';

function validIp(ip: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return ip.split('.').every(p => Number(p) <= 255);
  try { return ip.includes(':') && new URL(`http://[${ip}]/`).hostname.length > 0; } catch { return false; }
}

/** Forwarded addresses are trusted only behind an explicitly configured proxy. */
export async function getClientIp(req: Request | NextRequest): Promise<string> {
  if (process.env.HOMESTREAM_TRUST_PROXY === 'true') {
    const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip')?.trim() || req.headers.get('x-real-ip')?.trim();
    if (forwarded && validIp(forwarded)) return forwarded;
  }
  if ('ip' in req && typeof req.ip === 'string' && validIp(req.ip)) return req.ip;
  const peer = req.headers.get('x-homestream-socket') || '';
  const proof = req.headers.get('x-homestream-proof') || '';
  const secret = process.env.HOMESTREAM_SESSION_SECRET || '';
  const [ip, timestamp] = peer.split('|');
  if (secret.length >= 32 && validIp(ip || '') && /^\d+$/.test(timestamp || '') && Math.abs(Date.now() - Number(timestamp)) <= 30000 && /^[a-f0-9]{64}$/.test(proof)) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const signature = Uint8Array.from(proof.match(/../g)!, part => parseInt(part, 16));
    if (await crypto.subtle.verify('HMAC', key, signature, encoder.encode(peer))) return ip;
  }
  return '';
}


export function isLocalOrTailscaleIp(ip: string): boolean {
  const clean = ip.replace(/^::ffff:/i, '').toLowerCase();
  if (!validIp(clean)) return false;
  if (clean === '::1') return true;
  if (clean.includes(':')) return /^(fc|fd)/.test(clean) || /^fe[89ab]/.test(clean);
  const [a, b] = clean.split('.').map(Number);
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}

export async function isRequestLocalOrTailscale(req: Request | NextRequest): Promise<{ isLocalOrTailscale: boolean; clientIp: string; reason: string }> {
  const clientIp = await getClientIp(req);
  const trusted = isLocalOrTailscaleIp(clientIp);
  return { isLocalOrTailscale: trusted, clientIp, reason: trusted ? 'Trusted private client address' : 'Authentication required' };
}
