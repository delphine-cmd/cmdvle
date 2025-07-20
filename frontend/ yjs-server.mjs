// yjs-server.js
import * as http from 'http'
import WebSocket from 'ws'
import setupWSConnection from 'y-websocket/bin/utils.js'

const server = http.createServer()
const wss = new WebSocket.Server({ server })

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req)
})

const PORT = 1234
server.listen(PORT, () => {
  console.log(`🟢 Yjs WebSocket Server running at ws://localhost:${PORT}`)
})
