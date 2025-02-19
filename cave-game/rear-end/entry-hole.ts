import { Game } from "./Game"

console.log('rear end!')
console.log(process.cwd())

const port = new Game().start()
console.log(`http://localhost:${port}/`)
