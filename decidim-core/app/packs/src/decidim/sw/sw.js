import {
  imageCache,
  staticResourceCache,
  offlineFallback
} from "workbox-recipes";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, NetworkOnly } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";


// https://developers.google.com/web/tools/workbox/guides/troubleshoot-and-debug#debugging_workbox
self.__WB_DISABLE_DEV_LOGS = true

/**
 * This is a workaround to bypass a webpack compilation error
 *
 * The InjectManifest function requires the __WB_MANIFEST somewhere in this file,
 * however, we cannot add precacheAndRoute as the issue suggests,
 * as the other workbox-recipes won't work properly
 *
 * See more: https://github.com/GoogleChrome/workbox/issues/2519#issuecomment-634164566
 */
// eslint-disable-next-line no-unused-vars
const dummy = self.__WB_MANIFEST;

self.addEventListener("push", (event) => {
  let title = event.data.json().title;
  let body = event.data.json().body;
  let icon = event.data.json().icon;
  let url = event.data.json().url;
  let tag = "new-notification-tag";

  event.waitUntil(
    self.registration.showNotification(title, {body: body, icon: icon, tag: tag, data: { url: url }})
  )
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (let i = 0; i < clientList.length; i++) {
      let client = clientList[i];
      if (client.url === "/" && "focus" in client)
      {return client.focus();}
    }
    if (clients.openWindow)
    {return clients.openWindow(event.notification.data.url);}
  }));
});

// avoid caching admin or users paths
registerRoute(
  ({ url }) => ["/admin/", "/users/"].some((path) => url.pathname.startsWith(path)),
  new NetworkOnly()
);

// https://developers.google.com/web/tools/workbox/modules/workbox-recipes#pattern_3
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    networkTimeoutSeconds: 3,
    cacheName: "pages",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60
      })
    ]
  }),
);

// common recipes
staticResourceCache();

imageCache();

offlineFallback({ pageFallback: "/offline" });
