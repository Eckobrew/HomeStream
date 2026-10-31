// Capture the actual TCP peer before Next handles the request. Never trust a
// client-supplied identity, or auto-pair requests arriving through a proxy.
const http = require('node:http');
const crypto = require('node:crypto');
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function(event, req, ...args) {
  if (event === 'request' && req?.headers) {
    delete req.headers['x-homestream-socket'];
    delete req.headers['x-homestream-proof'];
    const proxied = ['forwarded', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'].some(h => req.headers[h]);
    const secret = process.env.HOMESTREAM_SESSION_SECRET;
    if (!proxied && secret?.length >= 32) {
      const identity = `${req.socket.remoteAddress}|${Date.now()}`;
      req.headers['x-homestream-socket'] = identity;
      req.headers['x-homestream-proof'] = crypto.createHmac('sha256', secret).update(identity).digest('hex');
    }
  }
  return emit.call(this, event, req, ...args);
};
