import express from 'express'
import expressWs from 'express-ws';
import type { WebSocket } from 'ws'
import { Connection } from './Connection';
import { ClientMessage } from '../communism/types';

let nextId = 0

export class Game {
  app = expressWs(express()).app
  connections = new Map<number, Connection>()

  constructor () {
    this.app.use(express.static('public'))

    this.app.ws('/fuck', this.#handleConnection)
  }

  #handleConnection = (ws: WebSocket) => {
    const conn = new Connection(nextId++, ws)
    this.connections.set(conn.id, conn)
    ws.addEventListener('close', () => {
      this.connections.delete(conn.id)
    })

    conn.send({ type: 'you are', id: conn.id })

    ws.addEventListener('message', e => {
      let message: ClientMessage
      try {
        if (typeof e.data !== 'string') {
          console.error('connection', conn.id, 'fucking sent us a', e.data)
          return
        }
        message = JSON.parse(e.data)
      } catch {
        console.error('connection', conn.id, 'fucking sent maldformed json', e.data)
        return
      }
      this.#handleMessage(conn, message)
    })
  }

  #handleMessage(conn: Connection, message: ClientMessage) {
    switch (message.type) {
      case 'chat': {
        for (const cxn of this.connections.values()) {
          cxn.send({ type: 'chat', user: conn.id, content: message.message })
        }
        break
      }
      default: {
        console.error('connection', conn.id, 'sent', message, 'cunt.')
      }
    }
  }

  /** i will literally die if you call me twice */
  start (port = 8080): number {
    this.app.listen(port)
    return port
  }
}
