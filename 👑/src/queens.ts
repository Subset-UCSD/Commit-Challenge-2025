// https://sheeptester.github.io/words-go-here/misc/queens.html

const colors = [
  { name: '--queens-board-color16', hex: 0xffe04b },
  { name: '--queens-board-color15', hex: 0xc387e0 },
  { name: '--queens-board-color14', hex: 0x729aec },
  { name: '--queens-board-color13', hex: 0x8acc6d },
  { name: '--queens-board-color12', hex: 0xff93f3 },
  { name: '--queens-board-color11', hex: 0x62efea },
  { name: '--queens-board-color10', hex: 0xa3d2d8 },
  { name: '--queens-board-color9', hex: 0xdfa0bf },
  { name: '--queens-board-color8', hex: 0xb9b29e },
  { name: '--queens-board-color7', hex: 0xe6f388 },
  { name: '--queens-board-color6', hex: 0xff7b60 },
  { name: '--queens-board-color5', hex: 0xdfdfdf },
  { name: '--queens-board-color4', hex: 0xb3dfa0 },
  { name: '--queens-board-color3', hex: 0x96beff },
  { name: '--queens-board-color2', hex: 0xffc992 },
  { name: '--queens-board-color1', hex: 0xbba3e2 }
].reverse()
const colorChannels = colors.map(({ hex, name }) => ({
  channels: [hex >> 16, (hex >> 8) & 0xff, hex & 0xff],
  name
}))
export const colorsByName = Object.fromEntries(
  colors.map(({ hex, name }) => [
     name,
    `#${hex.toString(16).padStart(6, '0')}`
   ])
)

export const hexColors = //Object.fromEntries(
  colors.map(({ hex, name }) =>// [
    //  name,
    `#${hex.toString(16).padStart(6, '0')}`
  //  ])
)

export type Coord = {
  x: number
  y: number
}
export type Solution = Coord[]
export type Color = number 
export type Grid = Color[][]

export function solve (grid: Grid): Generator<Solution> {
  // Partition the cells by color, so it maps color -> list of coordinates
  const regionCoords: Record<Color, Coord[]> = {}
  for (const [y, row] of grid.entries()) {
    for (const [x, color] of row.entries()) {
      regionCoords[color] ??= []
      regionCoords[color].push({ x, y })
    }
  }
  function * tryRegion (regions: Coord[][]): Generator<Solution> {
    // Sort colors by list size
    regions.sort((a, b) => a.length - b.length)
    const [smallest, ...remaining] = regions
    if (remaining.length === 0) {
      // Base case: all coords in region are solutions
      for (const coord of smallest) {
        yield [coord]
      }
    } else {
      // Smallest region first, try every cell
      for (const coord of smallest) {
        // Eliminate invalid queen locations from all other regions
        const filtered = remaining.map(coords =>
          coords.filter(
            ({ x, y }) =>
              x !== coord.x &&
              y !== coord.y &&
              (Math.abs(x - coord.x) > 1 || Math.abs(y - coord.y) > 1)
          )
        )
        // If one of the regions has no available cells, then this route
        // has no solutions
        if (filtered.some(region => region.length === 0)) {
          continue
        }
        // Recurse on remaining regions
        for (const solution of tryRegion(filtered)) {
          yield [coord, ...solution]
        }
      }
    }
  }
  return tryRegion(Object.values(regionCoords))
}

export const MAX = 1000
export type SolutionResult = {
  solutions: Solution[]
  tooMany: boolean
}
export function getSolutions(grid: Grid): SolutionResult {
  const solutions: Solution[] = []
  for (const solution of solve(grid)) {
    if (solution.length < grid.length) {
      continue
    }
    solutions.push(solution)
    if (solutions.length > MAX) {
      return { solutions, tooMany: true }
    }
  }
  return { solutions, tooMany: false }
}
