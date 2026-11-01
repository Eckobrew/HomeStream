/* HomeStream's idle slideshow is application UI, never PHOTO media playback. */
(() => {
  'use strict';
  const namespace = 'urn:x-cast:uk.eckonet.homestream';
  const notice = document.getElementById('notice');
  if (!window.cast?.framework) { notice.hidden = false; notice.textContent = 'Connect using a Google Cast device to start HomeStream.'; return; }
  const context = cast.framework.CastReceiverContext.getInstance();
  const manager = context.getPlayerManager();
  // Transcoding output may expose a growing buffered duration. The library
  // runtime is the full title duration, independent of how much is encoded.
  manager.setMessageInterceptor(cast.framework.messages.MessageType.MEDIA_STATUS, message => {
    for (const status of message.status || []) {
      const media = status.media;
      const duration = Number(media?.customData?.playback?.durationSeconds);
      if (media && Number.isFinite(duration) && duration > 0) media.duration = duration;
    }
    return message;
  });
  const images = [document.getElementById('slide-a'), document.getElementById('slide-b')];
  let slides = [], signature = '', index = 0, active = 0, serial = 0, timer = null, shownIdle = null;
  const idle = () => manager.getPlayerState() === cast.framework.messages.PlayerState.IDLE;
  function artwork(value) {
    if (typeof value !== 'string' || value.length > 16384) return null;
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
      if (['/api/mobile/v1/image', '/api/mobile/v1/parental-resource'].includes(url.pathname)) return url.href;
      if (url.protocol === 'https:' && ['image.tmdb.org', 'images.unsplash.com'].includes(url.hostname)) return url.href;
    } catch {}
    return null;
  }
  function nextSlide() {
    if (!slides.length || !idle()) return;
    const slide = slides[index++ % slides.length], next = 1 - active, version = ++serial;
    const image = images[next];
    image.onload = () => {
      if (version !== serial || !idle()) return;
      image.classList.add('active'); images[active].classList.remove('active'); active = next;
      document.getElementById('slide-title').textContent = slide.title;
    };
    image.onerror = () => { /* Keep the last good image and try the next on the next tick. */ };
    image.src = slide.artwork;
  }
  function stateChanged(force = false) {
    const standby = idle();
    document.body.classList.toggle('playing', !standby);
    context.setApplicationState(standby ? 'Ready to cast' : 'Watching HomeStream');
    if (shownIdle === standby && force !== true) return;
    shownIdle = standby;
    clearInterval(timer); timer = null;
    if (standby) { nextSlide(); timer = setInterval(nextSlide, 10000); }
    else { ++serial; notice.hidden = true; }
  }
  context.addCustomMessageListener(namespace, event => {
    let data = event.data;
    try { if (typeof data === 'string' && data.length <= 100000) data = JSON.parse(data); } catch { return; }
    if (!data || data.type !== 'idle' || !Array.isArray(data.items)) return;
    const valid = data.items.slice(0, 5).map(item => ({ title: String(item?.title || '').slice(0, 200), artwork: artwork(item?.artwork) })).filter(item => item.artwork);
    const updated = JSON.stringify(valid);
    if (updated !== signature) { signature = updated; slides = valid; index = 0; if (!slides.length) { ++serial; images.forEach(image => { image.onload = null; image.classList.remove('active'); image.removeAttribute('src'); }); document.getElementById('slide-title').textContent = ''; } stateChanged(true); }
  });
  manager.addEventListener(cast.framework.events.EventType.MEDIA_STATUS, stateChanged);
  manager.addEventListener(cast.framework.events.EventType.ERROR, () => {
    stateChanged(); notice.textContent = 'Playback could not start. Choose the title again in HomeStream.'; notice.hidden = false;
  });
  context.start({ statusText: 'Ready to cast', versionCode: 1, customNamespaces: { [namespace]: cast.framework.system.MessageType.JSON } });
  stateChanged();
})();
