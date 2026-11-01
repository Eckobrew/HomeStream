// Capture the actual TCP peer before Next handles the request. Never trust a
// client-supplied identity, or auto-pair requests arriving through a proxy.
const http = require('node:http');
const crypto = require('node:crypto');
const { isIP } = require('node:net');
const normalize = ip => String(ip || '').replace(/^::ffff:/i, '');
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function(event, req, ...args) {
  if (event === 'request' && req?.headers) {
    delete req.headers['x-homestream-socket'];
    delete req.headers['x-homestream-proof'];
    const proxied = ['forwarded', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'].some(h => req.headers[h]);
    const secret = process.env.HOMESTREAM_SESSION_SECRET;
    const peer = normalize(req.socket.remoteAddress);
    const trusted = (process.env.HOMESTREAM_TRUSTED_PROXIES || '').split(',').map(ip => normalize(ip.trim())).filter(Boolean);
    let client = !proxied ? peer : '';
    if (trusted.includes(peer)) {
      // Go reverse proxies append the socket client to XFF. Walk from the
      // trusted end; never accept an attacker-controlled leftmost address.
      const chain = String(req.headers['x-forwarded-for'] || '').split(',').map(ip => normalize(ip.trim()));
      while (chain.length && trusted.includes(chain[chain.length - 1])) chain.pop();
      client = chain.pop() || '';
    }
    if (isIP(client) && secret?.length >= 32) {
      const identity = `${client}|${Date.now()}`;
      req.headers['x-homestream-socket'] = identity;
      req.headers['x-homestream-proof'] = crypto.createHmac('sha256', secret).update(identity).digest('hex');
    }
  }
  return emit.call(this, event, req, ...args);
};
