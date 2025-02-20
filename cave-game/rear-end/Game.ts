import express from 'express'
import expressWs from 'express-ws';
import type { WebSocket } from 'ws'
import { Connection } from './Connection';
import { ClientMessage } from '../communism/messages';
import { mat4 } from 'gl-matrix';

let nextId = 0

// Here's a JavaScript function that generates a random quaternion:
function randomQuaternion() {
  let u1 = Math.random();
  let u2 = Math.random();
  let u3 = Math.random();

  let w = Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2);
  let x = Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2);
  let y = Math.sqrt(u1) * Math.sin(2 * Math.PI * u3);
  let z = Math.sqrt(u1) * Math.cos(2 * Math.PI * u3);

  return [w,x,y,z];
}
// This function returns a unit quaternion (randomly sampled from a uniform distribution over the 4D unit sphere). Let me know if you need modifications! 🚀

export class Game {
  app = expressWs(express()).app
  connections = new Map<number, Connection>()

  constructor () {
    this.app.use(express.static('public'))

    this.app.ws('/fuck', this.#handleConnection)

    setInterval(() => {
      for (const cxn of this.connections.values()) {
        cxn.send({ type: 'entire-state', objects: [{
          id: 'hey',
          model: './marcelos/notacube_smooth.glb',
          transform: [...mat4.fromRotationTranslationScale(mat4.create(), randomQuaternion(), [0,0,0],[0.1 + 1.5 * Math.random(), 0.1 + 1.5 * Math.random(), 0.1 + 1.5 * Math.random()])],
          interpolate: {
            duration: 1500
          }
        }] })
      }
    }, 1000)
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
