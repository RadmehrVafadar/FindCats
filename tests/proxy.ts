import { createServer, request } from 'node:http'

// Match the portfolio: strip the prefix and reject requests that escape it.
createServer((incoming, outgoing) => {
  const url = new URL(incoming.url!, 'http://127.0.0.1:5174')
  if (url.pathname === '/health') {
    outgoing.writeHead(200).end('Ready')
    return
  }
  if (url.pathname !== '/find-cats' && !url.pathname.startsWith('/find-cats/')) {
    outgoing.writeHead(404).end('Outside the game mount')
    return
  }
  const upstream = request({
    hostname: '127.0.0.1', port: 5174,
    path: (url.pathname.slice('/find-cats'.length) || '/') + url.search, method: incoming.method,
    headers: { ...incoming.headers, host: '127.0.0.1:5174' },
  }, response => {
    outgoing.writeHead(response.statusCode!, response.headers)
    response.pipe(outgoing)
  })
  upstream.on('error', () => outgoing.writeHead(502).end('Preview unavailable'))
  incoming.pipe(upstream)
}).listen(5175, '127.0.0.1')
