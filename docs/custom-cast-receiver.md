# HomeStream custom Cast receiver

Receiver URL: `http://homeflix.eckonet.uk/cast/receiver.html` for development. Published receivers require HTTPS; use the HTTPS version once your reverse proxy/certificate is configured.

Register a **Custom Receiver** named HomeStream in https://cast.google.com/publish/ and register the Chromecast test device before publishing. Google controls account registration and receiver/device activation. The app ID is public configuration, not a password.

Build Android with `-PcastReceiverAppId=YOUR_EIGHT_HEX_DIGIT_ID` (also `-PpreviewInstall=true` for the installed preview package). Without this property, Android continues to use the default media receiver. Do not replace it with an invented ID.

The receiver uses Google's hosted CAF runtime and standard media requests, so existing queue/autoplay/subtitle/seek messages remain supported by the receiver SDK. Actual hardware behavior still needs manual verification.

Standby artwork is sent over `urn:x-cast:uk.eckonet.homestream` as `{type:"idle",items:[{title,artwork}]}`. Only five artwork URLs are retained; two image elements crossfade every ten seconds. The Cast icon and Ready to cast text are receiver UI, not photo media. No household bearer token is sent to the receiver page. Kids artwork uses the existing scoped resource URLs and must be cleared on a profile switch.

Manual checks: register/launch; verify the TV overlay and slideshow while the phone shows no slideshow controls; start/pause/seek a movie; test subtitles, episode queues and autoplay; stop and confirm standby returns; switch to Kids and verify previous-profile artwork disappears. Leave CAF's normal idle/session lifecycle in place rather than disabling the media receiver's idle timeout.
