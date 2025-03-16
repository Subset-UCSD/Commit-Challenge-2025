import {  Fragment, MouseEvent, PointerEvent, useEffect, useRef, useState } from "react"
import { Color, getSolutions, hexColors } from "./queens"

declare module 'react' {
  export interface CSSProperties {
    [wow: `--${string}`]: string
  }
}

type CoordKey = `${number} ${number}`

const keys = '1234567890-='

type DragState = {
  pointerId: number
}

export type AppProps = {
// wow: 
}
export function App({}:AppProps) {
  const [size, setSize] = useState(8)
  const [puzzle, setPuzzle] = useState<Record<CoordKey, Color>>({})
const [current, setCurrent] = useState(0)
const dragState = useRef<DragState|null>(null)
const [solIndex, setSolIndex] = useState(0)

function getCell(row: number,col:number): Color {
  const value = puzzle[`${row} ${col}`] ?? col
  return value >= size ? 0 : value
}

const sol = getSolutions(Array.from({length:size}, (_, i) => Array.from({length:size}, (_, j) =>getCell(i,j))))
// console.log(sol)

useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    const index = keys.indexOf(e.key)
    if (index !== -1 && index < size) {
      setCurrent(index)
    }
  }
  document.addEventListener('keydown', handleKey)
  return () => {
    document.removeEventListener('keydown', handleKey)
  }
})

const handlePointerUp = (e: PointerEvent) => {
  if (e.pointerId === dragState.current?.pointerId) {
    dragState.current = null
  }
}
function setCoord(e: MouseEvent<HTMLDivElement>, middleClick = false) {
  const rect = e.currentTarget.getBoundingClientRect()
  const size = 40
  const gap = 5
  const x = Math.floor((e.clientX - rect.left - gap/2) / (size + gap))
  const y = Math.floor((e.clientY - rect.top - gap/2) / (size + gap))
  if (middleClick){
setCurrent(getCell(y,x))
  } else {
    
  setPuzzle(p => ({...p,[`${y} ${x}`]: current}))
  }
}

const freq: Record<Color,number> = Object.fromEntries(Array.from({length:size},(_,i)=>[i,0]))
for (let i = 0; i < size; i++)
  for (let j = 0; j < size; j++) {
const color = getCell(i,j)
// freq[color] ??= 0
// if (freq[color] !== undefined) {
  freq[color]++
// }
}

  return <>
  <p>Press number keys or middle click on board to change color.</p>
    <div className="palette">
    <button className="color" aria-label="Decrease board size" disabled={size <= 4} onClick={() => {
      setSize(s => s - 1)
      if (current >= size - 1) {
        setCurrent(size - 2)
      }
    }}>&minus;</button>
      {hexColors.slice(0, size).map((color, i) => <button className={`color ${i === current ? 'current':''}`} style={{backgroundColor: color}} aria-label={`Select color ${i+1}`}  key={i} onClick={() => setCurrent(i)}>{keys[i]}</button>)}
    <button className="color" aria-label="Increase board size" disabled={size >= hexColors.length} onClick={() => setSize(s => s + 1)}>+</button>
    </div>
    <div className="puzzle" style={{ '--size': String(size) }} 
      onPointerDown={e => {
        if (e.button === 1) {
          // middle click
          setCoord(e, true)
          return
        }
        if (!dragState.current) {
          dragState.current = {
            pointerId: e.pointerId
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          setCoord(e)
        }
      }}
      onPointerMove={e => {
        if (dragState.current?.pointerId === e.pointerId) {
          setCoord(e)
        }
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.from({length:size}, (_, i) => {
        return(
           //<div className="row" key={i}>
          // {
          Array.from({length:size},(_, j) => {
            const color = getCell(i,j)//puzzle[`${i} ${j}`] ?? j
            return <div className="square" key={`${i} ${j}`} style={{backgroundColor: hexColors[color]}}>
              {sol.solutions[Math.min(solIndex,sol.solutions.length-1)]?.some(q => q.x === j && q.y === i) ? '👑' : ''}
            </div>
          })
        //   }
        // </div>
        )
      }).flat()}
    </div>
    <p>
      <label>
      {sol.solutions.length === 0 ? 'No' : sol.tooMany ? `${sol.solutions.length-1}+` : sol.solutions.length} solution{sol.solutions.length === 1 ? '' : 's'} found. {sol.solutions.length === 0 ? '😔' : sol.solutions.length === 1 ? '🎉' : ''}{sol.solutions.length>1?
      <input type="range" min={0} max={sol.solutions.length-1} value={solIndex} onChange={e => setSolIndex(e.currentTarget.valueAsNumber)} />
      :null}
      </label>
    </p>
    <dl className="freqs">
      {Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([color,count])=>{
        return <Fragment key={color}>
        <dt className="mini" style={{backgroundColor: hexColors[+color]}} aria-label={`Color ${+color + 1}`}></dt>
        <dd>{count}</dd>
        </Fragment>
      })}
    </dl>
  </>
}
