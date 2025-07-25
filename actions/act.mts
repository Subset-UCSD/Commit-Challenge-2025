// node --experimental-strip-types actions/act.mts

import { execSync } from 'child_process'
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

;(globalThis as any).describeDay = describeDay
// ;(globalThis as any).setWorldInfo = setWorldInfo
;(globalThis as any).worldInfo = state.worldInfo
;(globalThis as any).players = new Proxy(state.players, {
  get(target, p, receiver) {
    if (typeof p === 'symbol') {
      return
    }
    if (p === 'hasOwnProperty') {
      return (key: string) => !!state.players[key]
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
  ;(globalThis as any)[name] = new Player(name, player)
  // just in case
  ;(globalThis as any)[name.toLowerCase()] = new Player(name, player)
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
const d20Rolls = Object.keys(state.players).map(name => `- ${name}: ${Math.floor(Math.random() * 20 + 1)}`).join('\n')
console.error(d20Rolls)

// gemini tried to do worldInfo.npcs.forEach once but npcs is an object.. what a fool...
;(Object.prototype as any).forEach = function (func: Function, thisArg: any) {
  for (const [key, value] of Object.entries(this)) {
      func.call(thisArg, value, key, this)
  }
}

const gameState = `\`\`\`json\n${JSON.stringify(state)}\n\`\`\`` // `\`\`\`yaml\n${yamlRaw}\n\`\`\``


/** max length of discord embed desc */
const totalMaxLength = 4000
function generateDiscordResponse (responseMd: string): string[] {
  let responseLines = responseMd.trim().split(/\r?\n/).flatMap(line => {
    if (!line) {
        return ['']
    }
    // split them if they're too long somehow
    const lines: string[] =[]
    for (let i = 0; i < line.length; i += totalMaxLength) {
      lines.push(line.slice(i, i + totalMaxLength))
    }
    return lines
  })
  responseLines.push('','-# [state](<https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/actions/state.yml>) |  Write your next action in [actions.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions.md>)!')
  return responseLines
}


async function say(lines: string, footer: string): Promise<void> {
  const r = await fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify({
      // "content":
      // discordResponse2
      // ,
      embeds: [{
        description: lines//.join('\n')
        ,
        "footer": {
          "text": footer
        },
      }],
      "username":"gamer",
      "avatar_url":"https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/softwareengineer.png"
    }),
    "method": "POST",
  })
  if (!r.ok) {
    console.error(await r.text())
  }
}

async function printDiscord(responseLines: string[]) {
  const blocks: string[] = []
  let text = ''
  for (const line of responseLines) {
    if ((text+line).length > totalMaxLength) {
      blocks.push(text)
      text = line
    } else {
      if (text) {
        text += '\n'
      }
      text += line
    }
  }
  if (text) {
    blocks.push(text)
  }
  console.error(blocks)
  try {
    for (const [i,block] of blocks.entries()) {
      await say(block, `Page ${i+1} of ${blocks.length}`)
      console.error(`[discord] ${i+1} of ${blocks.length}`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  } catch (error) {
    console.error("DISCORD WEBHOOK FAIL")
    console.error(error)
  }
}

// dont block state generation



const responseJs: GenerateContentResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`, {
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
              (await readFile('./actions/prompt_state.md', 'utf-8')).trim(),
              // "Here was today's exposition:",
              // responseMd,
              'Here are the players and world state as of the previous day:',
              gameState,
              "Here are the players' d20 rolls:",
              d20Rolls,
              'Here are the player\'s actions for the day:',
              (await readFile('./actions.md', 'utf-8')).trim(),
            ].join('\n\n')
          }
        ]
      }
    ]
  })
}).then(r => r.json()) as any
const origJs = responseJs.candidates[0].content.parts[0].text
let js = origJs

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
;( globalThis as any)['_p'] = _p


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

const origLog = console.log
console.log = () => {}

// avoid scary eval
new Function(js)()

console.log = origLog

delete (state as any)['previousResponses']
// console.error(responses)
// console.error(state)
await writeFile('./actions/state.yml', YAML.stringify(state, (key, value) => value instanceof Player ? value.name : Number.isNaN(value) ? undefined : value))



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
              (await readFile('./actions/prompt_respond.md', 'utf-8')).trim(),
              "Here are today's events, described as code:",
              // gemini's JS is typically already wrapped in a code block
              // '```javascript\n' + 
              origJs 
              //+ '\n```'
              ,
              "Here is the game state, including a diff of the changes made today:",
              '```diff\n' + 
              // show 10000 lines of context
              execSync('git diff -U10000 --no-prefix actions/state.yml')
              + '\n```',
              // 'Here are the players and world state as of the previous day:',
              // gameState,
              // "Here are the players' d20 rolls:",
              // d20Rolls,
              // 'Here are the player\'s actions for the day:',
              // (await readFile('./actions.md', 'utf-8')).trim(),
            ].join('\n\n')
          }
        ]
      }
    ]
  })
}).then(r => r.json()) as any
let responseMd = response.candidates[0].content.parts[0].text
console.log(responseMd)
await printDiscord(generateDiscordResponse(responseMd))


// const genDiscordResponse = (maxLength = Infinity) => `${responses.world.length > maxLength?responses.world.slice(0,maxLength-3)+'[…]':responses.world}\n${Object.entries(responses.players).map(([name, response]) => `## ${name}\n${response.length > maxLength?response.slice(0,maxLength-3)+'[…]':response}`).join('\n')}\n\n-# [state](<https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/actions/state.yml>) |  Write your next action in [actions.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions.md>)!`

// let discordResponse = genDiscordResponse()
// console.log(discordResponse)

// for (let maxLength = 3900; maxLength > 0; maxLength -= 5) {
//   discordResponse = genDiscordResponse(maxLength)
//   if (discordResponse.length <= totalMaxLength) {
//     break
//   }
// }
