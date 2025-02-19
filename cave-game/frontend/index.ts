import { ServerMessage } from "../communism/types";
import { send } from "./net";

console.log('frontend!')

const ul = document.createElement('ul')
document.body.append(ul)

let myId = -1
export function handleMessage (message: ServerMessage) {
  switch (message.type) {
    case 'chat': {
      const li = document.createElement('li')
      li.style.whiteSpace = 'pre-wrap'
      if (myId === message.user) {
        li.append(`<我> ${message.content}`)
      } else {
        li.append(`<user${message.user.toString().padStart(3, '0')}> ${message.content}`)
      }
      ul.prepend(li)
      break
    }
    case 'you are': {
      myId = message.id
      break
    }
    default: {
      console.error('fdsluihdif', message)
    }
  }
}

const f = document.getElementById('f')
if (f instanceof HTMLFormElement) {
  f.addEventListener('submit', e => {
    e.preventDefault()

    const thing = new FormData(f).get('message')
    if (typeof thing === 'string') {
      send({ type: 'chat', message: thing })
      f.reset()
    }
  })
}
