console.error(
  "right now is ",
  new Date(),
  new Date().toLocaleString(),
  new Date().toString()
);
const today = new Date();
console.log(
  new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
);
