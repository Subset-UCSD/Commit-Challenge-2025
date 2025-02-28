import { Game } from "./Game"

console.log('rear end!', new Date())
console.log(process.cwd())

const port = new Game().start()
console.log(`http://localhost:${port}/`)
