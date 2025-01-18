export type Obstacle = {
  x:number
  y:number
  width:number
  height: number
}

const xywh = (x:number,y:number,width:number,height:number)=>({x,y,width,height})
const xxyy = (x1:number,x2:number,y1:number,y2:number)=>({x:Math.min(x1,x2),y:Math.min(y1,y2),width:Math.max(x1,x2)-Math.min(x1,x2),height:Math.max(y1,y2)-Math.min(y1,y2)})

const boundarySize = 1000;
const boundaryBorderSize = 50;

export const obstacles = [
	xxyy(-boundarySize - boundaryBorderSize, -boundarySize, -boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize),
	xxyy(-boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize, -boundarySize - boundaryBorderSize, -boundarySize),
  xxyy(-boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize, boundarySize, boundarySize + boundaryBorderSize),
  xxyy(boundarySize, boundarySize + boundaryBorderSize, -boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize),
  xywh(400,400,50,50),
]

export const inside = ({x,y}:{x:number,y:number},o:Obstacle)=>o.x<=x&&x<=o.x+o.width && o.y<=y&&y<=o.y+o.height
export const insideAny = (p:{x:number,y:number})=>obstacles.some(o=>inside(p,o))