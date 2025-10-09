/// <reference lib="webworker" />
// need to export default null to satisfy typescript
export default null;
declare let self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  self.skipWaiting();
  console.info("Service worker installed");
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.info("Service worker activated");
});

const CACHE_NAME = "RPC_FETCH_CACHE";

const fetchWithCacheFirst = async (
  request: Request,
  cacheKey: string
): Promise<Response> => {
  const cache = await caches.open(CACHE_NAME);

  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    cache.put(cacheKey, response.clone());
  }

  return response;
};

self.addEventListener("fetch", function (e) {
  const req = e.request.clone();

  const res = (async () => {
    if (req.method === "POST") {
      const payload = await req.json();
      const path = payload?.params?.path;

      if (
        path &&
        (path.includes("/shell/conv") ||
          path.includes("/vp/token/denomination"))
      ) {
        const response = await fetchWithCacheFirst(
          e.request,
          payload.params.path
        );

        return response;
      }
    }

    return fetch(e.request);
  })();

  e.respondWith(res);
});
