## development

requires node 22+ for `--experimental-strip-types` to run typescript

```shell
$ cd cave-game
$ npm install
$ npm run dev
```

open http://localhost:8080/ in the browser

## build

```shell
$ npm run build
```

run the server:

```shell
$ cd cave-game/
$ node dist/index.js
```

## design

game goals

- browser based client
- any party size (1+)
- multiplayer
- easy for an early game player to play with a late game player
- get Marcelo addicted to the game

### game idea

everyone starts from a central hub. you go out into a cave with randomly generated paths between rooms, get loot, and return to the hub

lore: everyone in the caves came from the surface and got lost in the constant rearrangement of cave. the hub is founded by adventurers, for adventurers. you are rewarded for helping the commune retrieve unconscious adventurers and food in the caves

loot chests are individual to each player, except for items put in by other players, which are global. entities are per party, you can encounter other players, but only gilded players can be attacked

there's a day night cycle, local to parties. to survive the night, you must return to the hub or make a camp. during the night, the cave rearranges itself and entities respawn. the game incentivizes not staying out for too long (by inventory capacity limits and/or insanity), but going further gives better loot. ideally players stay just one night in the caves

you can bring a map that'll record your route and annotate special rooms. you can use this to travel back to the hub, and sell this to other players. however, you can make fake maps. buyers only know if the map is genuine if the map is appraised by an NPC for a great fee; this can be done by the seller or buyer

ever few hours, a sector of the caves fully reset, rendering all existing maps in the sector void. players will have to quickly explore new routes and sell valuable, long lasting maps. however, old sectors tend to have many camps left from previous players, incentivizing exploring in them. some items aren't available at all times, so become valuable and must be bought

upon death in the caves, you lose your items. you respawn with a map to your grave. other players can loot graves; unlike loot chests, this is global. you can give your map to someone else to have them retrieve your items for you; with an expensive licensed bag you can ensure they don't keep your stuff

you can form guilds, which get dedicated houses in the hub. all players can get small apartments in the hub to store their items. apartments closer to ground level and the cave entrance are more expensive

loot items:

- currency (MVP)

- junk (cobwebs, dust, hair)

- crafting materials for

  - special damage effects
  - better weapons
  - healing tonics, immunity brews for certain damage types
