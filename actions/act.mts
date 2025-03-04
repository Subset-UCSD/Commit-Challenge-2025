// node --experimental-strip-types actions/act.mts

import { readFile, writeFile } from 'fs/promises'
import YAML from 'yaml'
// import { users } from '../remind/people.mjs'

type PlayerObject = {
  health: number
  inventory: Record<string, number>
  info: Record<string, any>
}
type State = {
  players: {
    [name: string]: PlayerObject
  }
  day: number
  worldInfo: Record<string, any>
}

const yamlRaw = await readFile('./actions/state.yml', 'utf-8')
const state: State = YAML.parse(yamlRaw)
state.day++

const responses: {
  players: Record<string, string>
  world: string
} = {
  players: Object.fromEntries(Object.keys(state.players).map(playerName => [playerName, ''])),
  world: ''
}

/** Describe the day and summarize the situation to all players. Required. */
function describeDay(text: string) {
  if (responses.world) {
    responses.world += '\n\n'
  }
  responses.world += text
}

/** Set metadata for yourself about the world, like potion effects, to store in the `worldInfo` object. */
function setWorldInfo(key: string, value: any) {
  state.worldInfo[key] = value
}

class Player {
  name: string
  player: PlayerObject

  constructor (name: string, player: PlayerObject) {
    this.name = name
    this.player = player
  }

  get health () {
    return this.player.health
  }

  get inventory () {
    return this.player.inventory
  }

  get info () {
    return this.player.info
  }

  /** Send a response to the player describing the consequences of their actions. Required for each player. */
  respond(text: string) {
    if (responses.players[this.name]) {
      responses.players[this.name] += '\n\n'
    }
    responses.players[this.name] += text
  }

  /** Changes the player's health by `delta` HP. */
  changeHealth(delta: number) {
    this.player.health += delta
  }

  /** Add item(s) to the player's inventory. `count` defaults to 1. */
  addItem(itemName: string, count: number = 1) {
    this.player.inventory[itemName] ??= 0
    this.player.inventory[itemName] += count
  }

  /** Remove item(s) from the player's inventory. `count` defaults to 1. */
  removeItem(itemName: string, count: number = 1) {
    if (this.player.inventory[itemName]) {
      this.player.inventory[itemName] -= count
      if (this.player.inventory[itemName] <= 0) {
        delete this.player.inventory[itemName]
      }
    }
  }

  /** Set metadata for yourself about the player, like potion effects, to store in their `info` object. */
  setPlayerInfo(key: string, value: any) {
    this.player.info[key] = value
  }
}

const players_: Record<string, Player> = Object.fromEntries(Object.entries(state.players).map(([name, player]) => [name.toLowerCase(), new Player(name, player)]))
// in case gemini does `players.Gerald`; these changes will be moved to `state.worldInfo`
const extraPlayers: Record<string, Player> = {}

globalThis.describeDay = describeDay
globalThis.setWorldInfo = setWorldInfo
globalThis.worldInfo = state.worldInfo
globalThis.players = new Proxy({}, {
  get(target, p, receiver) {
    if (typeof p === 'symbol') {
      return
    }
    p = p.toLowerCase()
    if (players_[p]) {
      return players_[p]
    }
    extraPlayers[p] ??= new Player(p, state.worldInfo[`npc_${p}`] = { health: 100, inventory: {}, info: {} })
    return extraPlayers[p]
  },
  has(target, p) {
    if (typeof p === 'string') {
      p = p.toLowerCase()
    }
    return Object.hasOwn(players_, p) || Object.hasOwn(extraPlayers, p)
  },
})
// for (const [name, player] of Object.entries(state.players)) {
//   globalThis[name] = new Player(name, player)
//   // just in case
//   globalThis[name.toLowerCase()] = new Player(name, player)
// }

// const discordMap = Object.fromEntries(users.map(({ discord, playerName }) => [playerName, discord]))

type GenerateContentResponse = {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
  }[]
}
const response: GenerateContentResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`, {
  "headers": {
    "content-type": "application/json",
  },
  method: 'POST',
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: [
              (await readFile('./actions/prompt.md', 'utf-8')).trim(),
              'Here are the player statuses and world state as of the previous day, as set by you:',
              `\`\`\`yaml\n${yamlRaw}\n\`\`\``,
              'Here are the player\'s actions for the day:',
              (await readFile('./actions.md', 'utf-8')).trim(),
            ].join('\n\n')
          }
        ]
      }
    ]
  })
}).then(r => r.json())
let js = response.candidates[0].content.parts[0].text

js = js.trim().replace(/^```/gm, m => '//' + m)
// if (js.startsWith('```')) {
//   js = js.replace(/^```\w+/, '')
// }

console.error(js)

eval(js) // lmao

state['previousResponses'] = responses
// console.error(responses)
console.error(state)
await writeFile('./actions/state.yml', YAML.stringify(state))

const discordResponse = `${responses.world}\n${Object.entries(responses.players).map(([name, response]) => `## ${name}\n${response}`).join('\n')}\n\n-# Write your next action in [actions.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions.md>)!`
console.log(discordResponse)

fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
  "headers": {
    "content-type": "application/json",
  },
  "body": JSON.stringify({
    "content":
    discordResponse
    ,
    "username":"gamer",
    "avatar_url":"https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/softwareengineer.png"
  }),
  "method": "POST",
}).catch(console.error)
