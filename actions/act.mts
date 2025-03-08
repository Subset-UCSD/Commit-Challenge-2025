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
function describeDay(text: string): '' {
  if (!text) {
    return ''
  }
  if (responses.world) {
    responses.world += '\n\n'
  }
  responses.world += text
  return ''
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

  set health (health: number) {
    this.player.health = health
  }

  get inventory () {
    return this.player.inventory
  }

  set inventory(value: unknown) {
    console.error(`[set inventory] Blocked attempt to set ${this.name} inventory to`, value)
  }

  get info () {
    return this.player.info
  }

  set info(value: unknown) {
    console.error(`[set info] Blocked attempt to set ${this.name} info to`, value)
  }

  /** Send a response to the player describing the consequences of their actions. Required for each player. */
  respond(text: string): '' {
    if (!text) {
      return ''
    }
    if (responses.players[this.name]) {
      responses.players[this.name] += '\n\n'
    }
    responses.players[this.name] += text
    return ''
  }

  /** Add item(s) to the player's inventory. `count` defaults to 1. */
  addItem(itemName: string, count: number = 1) {
    if (count < 0) {
      this.removeItem(itemName, -count)
      return
    }
    this.player.inventory[itemName] ??= 0
    this.player.inventory[itemName] += count
  }

  /** Remove item(s) from the player's inventory. `count` defaults to 1. */
  removeItem(itemName: string, count: number = 1) {
    if (count < 0) {
      this.addItem(itemName, -count)
      return
    }
    if (this.player.inventory[itemName]) {
      this.player.inventory[itemName] -= count
      if (this.player.inventory[itemName] <= 0) {
        delete this.player.inventory[itemName]
      }
    }
  }
}

const players_: Record<string, Player> = Object.fromEntries(Object.entries(state.players).map(([name, player]) => [name.toLowerCase(), new Player(name, player)]))
// in case gemini does `players.Gerald`; these changes will be moved to `state.worldInfo`
const extraPlayers: Record<string, Player> = {}

globalThis.describeDay = describeDay
// globalThis.setWorldInfo = setWorldInfo
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
  ownKeys(target) {
    return Object.keys(state.players)
  },
})
for (const [name, player] of Object.entries(state.players)) {
  globalThis[name] = new Player(name, player)
  // just in case
  globalThis[name.toLowerCase()] = new Player(name, player)
}

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

// "ensure path"
function _p(baseObject: any, path: string[]): any {
  let object = baseObject
  for (const key of path) {
    object[key] ??= {}
    object = object[key]
  }
  return object
}
globalThis['_p'] = _p

// let prefix = ''
// |players\[[a-zA-Z]\w*\]
// for (const ref of new Set(Array.from(js.matchAll(/(?:worldInfo|players\.[a-zA-Z]\w*)(?:\.[a-zA-Z]\w*)+/g), a => a[0]))) {
// for (const [ref] of js.matchAll(/(?:worldInfo|players\.[a-zA-Z]\w*|players\[[a-zA-Z]\w*\])(?:\.[a-zA-Z]\w*)+/g)) {
js = js.replace(/(worldInfo|players(?:\.[a-zA-Z]\w*|\[[a-zA-Z]\w*\])\.(?:inventory|info))((?:\.[a-zA-Z]\w*){2,})/g, (_, left, right) => {
      const names = right.split('.')
      // if (names[0] === 'players') {
      //   names.splice(0, 2, names.slice(0, 2).join('.'))
      // }
      names[0] = left
      let code = `_p(${left}, ${JSON.stringify(names.slice(1,-1))}).${names.at(-1)}`
      // for (let i = 2; i < names.length; i++) {
      //   code += `${names.slice(0, i).join('.')} ??= {}, `
      // }
      // code += `${names.slice(0,-1).join('.')}).${names.at(-1)}`
      return code
    // }
    // js = prefix + js
    
})
// js = js.replace(/^[ \t]*\(\/\*/gm, ';(/*')

console.error(js)

eval(js) // lmao

state['previousResponses'] = responses
// console.error(responses)
console.error(state)
await writeFile('./actions/state.yml', YAML.stringify(state, (key, value) => value instanceof Player ? value.name : value))

const maxLength = Math.floor(3900 / (Object.entries(responses.players).length + 1))
const discordResponse = `${responses.world}\n${Object.entries(responses.players).map(([name, response]) => `## ${name}\n${response}`).join('\n')}\n\n-# Write your next action in [actions.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions.md>)!`
console.log(discordResponse)

const discordResponse2 = `${responses.world.length > maxLength?responses.world.slice(0,maxLength-3)+'[…]':responses.world}\n${Object.entries(responses.players).map(([name, response]) => `## ${name}\n${response.length > maxLength?response.slice(0,maxLength-3)+'[…]':response}`).join('\n')}\n\n-# Write your next action in [actions.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions.md>)!`

fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
  "headers": {
    "content-type": "application/json",
  },
  "body": JSON.stringify({
    // "content":
    // discordResponse2
    // ,
    embeds: [{
      description: discordResponse2
    }],
    "username":"gamer",
    "avatar_url":"https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/softwareengineer.png"
  }),
  "method": "POST",
}).catch(console.error)
