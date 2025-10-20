// cloudflare-workers/atlas-cdn.js
// Atlas Framework - Cloudflare Workers CDN Router

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // API requests -> Backend
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    const backendUrl = 'https://api.yourdomain.com' + url.pathname + url.search

    const modifiedRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })

    const response = await fetch(modifiedRequest)
    const modifiedResponse = new Response(response.body, response)

    // Add CORS headers
    Object.keys(corsHeaders).forEach(key => {
      modifiedResponse.headers.set(key, corsHeaders[key])
    })

    return modifiedResponse
  }

  // Static assets -> S3/GCS
  const staticUrl = 'https://frontend-bucket.s3.amazonaws.com' + url.pathname
  const response = await fetch(staticUrl)

  // Cache static assets
  const cache = caches.default
  const cacheKey = new Request(staticUrl)

  // Check cache first
  let cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }

  // Cache for 1 hour
  const modifiedResponse = new Response(response.body, response)
  modifiedResponse.headers.set('Cache-Control', 'public, max-age=3600')

  event.waitUntil(cache.put(cacheKey, modifiedResponse.clone()))

  return modifiedResponse
}
