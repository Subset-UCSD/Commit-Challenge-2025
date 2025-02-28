/**
 * game state manager AND http server
 * 
 * 🎉 this is the main entry point of the backend
 */

import express from 'express'
import expressWs from 'express-ws';
import type { WebSocket } from 'ws'
import { Player } from './Player';
import { ClientMessage } from '../communism/messages';
import { mat4 } from 'gl-matrix';
import { readFile, writeFile } from 'node:fs/promises';

type Database = {
	chats?: string[]
}
const database: Database = JSON.parse(await readFile('./db.json', 'utf-8').catch(() => '{}'))
database.chats??= []

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
	activePlayers = new Map<number, Player>()

	constructor () {
		this.app.use(express.static('public'))

		this.app.ws('/fuck', this.#handleplayerjoin)

		setInterval(() => {
			for (const cxn of this.activePlayers.values()) {
				cxn.send({ type: 'entire-state', objects: [{
					id: 'hey',
					model: './marcelos/notacube_smooth.glb',
					transform: [...mat4.fromRotationTranslationScale(mat4.create(), randomQuaternion(), [0,0,0],[0.1 + 1.5 * Math.random(), 0.1 + 1.5 * Math.random(), 0.1 + 1.5 * Math.random()])],
					interpolate: {
						duration: 1500
					}
				}, {
					id: 'floor',
					model: './marcelos/floor.glb',
					transform: [...mat4.fromTranslation(mat4.create(), [0, -1, 0])],
					interpolate: {
						duration: 1500
					}
				}] })
			}
		}, 1000)
	}

	#handleplayerjoin = (ws: WebSocket) => {
		const player = new Player(nextId++, ws)
		this.activePlayers.set(player.id, player)
		ws.addEventListener('close', () => {
			this.activePlayers.delete(player.id)
		})

		player.send({ type: 'you are', id: player.id })
		player.send({type: 'chats',contents:database.chats ?? []})

		ws.addEventListener('message', e => {
			let message: ClientMessage
			try {
				if (typeof e.data !== 'string') {
					console.error('playerection', player.id, 'fucking sent us a', e.data)
					return
				}
				message = JSON.parse(e.data)
			} catch {
				console.error('playerection', player.id, 'fucking sent maldformed json', e.data)
				return
			}
			this.#handleMessage(player, message)
		})
	}

	async #handleMessage(player: Player, message: ClientMessage) {
		switch (message.type) {
			case 'chat': {
				for (const cxn of this.activePlayers.values()) {
					cxn.send({ type: 'chat', user: player.id, content: message.message })
				}
				database.chats?.push(`[${player.id}] ${message.message}`)
				await writeFile('./db.json', JSON.stringify(database))
				break
			}
			case 'key-state-update': {
				console.log(player.id, 'pressed sum keys', message.keys)
				break
			}
			default: {
				console.error('playerection', player.id, 'sent', message, 'cunt.')
			}
		}
	}

	/** i will literally die if you call me twice */
	start (port = 8080): number {
		this.app.listen(port)
		return port
	}
}
