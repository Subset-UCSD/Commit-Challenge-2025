#set page(width: 800pt, height: 600pt, margin: 1in)
#set text(size: 10pt)

#let box(width, body) = rect(
  width: width,
  radius: 2pt,
  inset: 8pt,
  stroke: 1pt,
  align(center, body),
)

#let arrow = path(
  (0, 0),
  (0, 20pt),
  stroke: 1pt,
)
#let arrow-head = path(
    (-4pt, 16pt),
    (0, 20pt),
    (4pt, 16pt),
    stroke: 1pt,
)


#let jules-flow = grid(
  columns: (1fr),
  row-gutter: 20pt,
  align: center,
  box(200pt, "User creates issue with Jules tag"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Jules starts task"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Jules completes task"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Jules creates PR"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "purr GitHub Action"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Mark PR 'ready for review'"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Merge PR"),
)

#let user-flow = grid(
  columns: (1fr),
  row-gutter: 20pt,
  align: center,
  box(200pt, "User commits & pushes to branch"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "User opens PR"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "purr GitHub Action"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Close PR"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "User is supposed to commit to main"),
  grid(columns: (1fr), align:center, arrow, arrow-head),
  box(200pt, "Jules gets an exception"),
)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 50pt,
  jules-flow,
  user-flow,
)
