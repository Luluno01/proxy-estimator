import { request, ClientRequest } from 'http'
import { Socket } from 'net'


export type HTTPConnectOpts = {
  host?: string
  port: number
  proxyHost?: string
  proxyPort: number
}

/**
 * @description HTTP proxy client helper.
 * Create a TCP connection through an HTTP proxy.
 */
export function createConnection({
  host='localhost', port,
  proxyHost='localhost', proxyPort
}: HTTPConnectOpts): Promise<Socket> {
  // Connect to proxy server
  let req: ClientRequest = request({
    host: proxyHost || 'localhost',
    port: proxyPort,
    method: 'CONNECT',
    path: `${host}:${port}`
  })
  req.end()
  return new Promise((resolve, reject) => {
    req.on('error', err => reject(err))
    req.on('timeout', () => reject('timeout'))
    req.on('connect', (res, socket: Socket /* , head */) => {
      resolve(socket)
    })
  })
}

export default createConnection