/** Public origin is explicit: never trust a client-supplied forwarded host. */
export function publicOrigin(request: Request): string {
  const configured = process.env.HOMESTREAM_EXTERNAL_URL;
  if (configured) {
    try { return new URL(configured).origin; } catch { /* use request URL */ }
  }
  return new URL(request.url).origin;
}

export function validRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const configured = publicOrigin(request);
  const secureUpgrade = configured.replace(/^http:/, 'https:');
  return !origin || origin === new URL(request.url).origin || origin === configured || origin === secureUpgrade;
}

export function secureSessionCookie(request: Request): boolean {
  const origin = request.headers.get('origin');
  return (origin && validRequestOrigin(request) ? origin : publicOrigin(request)).startsWith('https:');
}
