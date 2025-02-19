// node --experimental-strip-types cave-game/build.ts watch

import { exit } from "process"
import * as esbuild from 'esbuild'
import nodemon from 'nodemon'
import type { Nodemon, NodemonSettings } from 'nodemon'

const subcommands = ['build', 'watch']
const subcommand = process.argv[2]
if (!subcommands.includes(subcommand)) {
  console.error(`Usage: node cave-game/build.ts (${subcommands.join('|')})`)
  exit(1)
}

const watchMode = subcommand === 'watch'

const serverContext = await esbuild.context({
  entryPoints: ['cave-game/rear-end/entry-hole.ts'],
  bundle: true,
  platform: 'node',
  packages: 'external',
  // outdir: 'cave-game/dist/',
  outfile: 'cave-game/dist/index.js',
  format: 'esm',
})

const clientContext = await esbuild.context({
  entryPoints: ['cave-game/frontend/index.ts'],
  bundle: true,
  loader: {
    '.frag': 'text',
    '.vert': 'text',
  },
  outdir: 'cave-game/public/',
  // format: 'esm',
  supported: {
    'nesting': false,
  },
  minify: !watchMode,
  sourcemap: true
})

if (watchMode) {
  serverContext.watch()
  clientContext.watch()
  // wtf
  ;(nodemon as any as (settings: NodemonSettings) => Nodemon)({
    script: 'dist/index.js',
    watch: ['cave-game/dist/'],
    cwd: 'cave-game/'
  })

  process.on('SIGINT', () => {
    console.log()
    process.exit()
  })
} else {
  await serverContext.rebuild()
  await serverContext.dispose()
  await clientContext.rebuild()
  await clientContext.dispose()
}
