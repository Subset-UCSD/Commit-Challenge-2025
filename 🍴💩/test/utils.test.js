const a=require('assert')
const {r,hue}=require('../怖い森🌲/utils.js')

for(let i=0;i<5;i++){
 const val=r(5,1)
 a.ok(val<=5&&val>=1,'range check')
}
a.strictEqual(hue(370),'hsl(10,100%,50%)')
