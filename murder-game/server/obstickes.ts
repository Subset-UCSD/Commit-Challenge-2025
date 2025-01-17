export type Obstacle = {
  x:number
  y:number
  width:number
  height: number
}

const xywh = (x:number,y:number,width:number,height:number)=>({x,y,width,height})
const xxyy = (x1:number,x2:number,y1:number,y2:number)=>({x:Math.min(x1,x2),y:Math.min(y1,y2),width:Math.max(x1,x2)-Math.min(x1,x2),height:Math.max(y1,y2)-Math.min(y1,y2)})

export const obstacles = [
  xxyy(-50,-100,-100,1000),
  xxyy(-100,1000,-50,-100),
  xxyy(1000,1050,-100,1050),
  xxyy(-100,1050,1000,1050),
  xywh(400,400,50,50),
]

export const inside = ({x,y}:{x:number,y:number},o:Obstacle)=>o.x<=x&&x<=o.x+o.width && o.y<=y&&y<=o.y+o.height
export const insideAny = (p:{x:number,y:number})=>obstacles.some(o=>inside(p,o))