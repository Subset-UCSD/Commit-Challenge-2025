let inventory = []

function BEGINNING () {
  let description = "you stand in a desolate courtyard shrounded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south. "
  if (inventory.length === 0) {
    description += "you have no memory , no items in hand. "
  }
  let choices = {
    "go north": northPath,
    "go south": southPath,
  }
  return {
    location: "courtyard",
    description,
    choices,
  }
}

function northPath () {
  let description = "the path trails off, leaving you standing on a field of uncut grass. "
  let choices = {
    "go south": BEGINNING,
    "pick grass": () => {
      inventory.push('blade of grass')
      return "you pluck a blade of grass from the ground. +1 blade of grass."
    }
  }
  return {
    location: "field",
    description,
    choices,
  }
}

let spermDonorPoster = true
let wincoFish = true
function southPath () {
  let description = "the path abruptly ends at a brick wall. you jump to look over, but all you see is fog. "
  let choices = {
    "go north": BEGINNING,
  }
  if (wincoFish) {
    description += "there is a frozen fish wrapped in plastic at the base of the wall. the packaging says it's from winco. "
    choices["take fish"] = () => {
      inventory.push("fish")
      wincoFish = false
      return "you put the fish in your pocket. +1 fish."
    }
  }
  if (spermDonorPoster) {
    
    description += "there is a sperm donor poster on the wall. a handsome man smiles at you and beckons for your sperm. "
    choices["take sperm donor poster"] = () => {
      inventory.push("sperm donor poster")
      spermDonorPoster = false
      return "you carefully rip off the poster, revealing a hole just large enough for you to crawl through. +1 poster."
    }
  } else {
    choices["enter hole"] = () => {
      return "the hole reveals a dead end. maybe there will be something here in the future?"
    }
  }
  return {
    location: "brick wall",
    description,
    choices,
  }
}
