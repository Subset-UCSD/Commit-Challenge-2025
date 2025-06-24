#let name = "Project"

= #name Game Design Document
The following is our concept design for a multiplayer role-playing roguelike game, #name, designed for PC. We're trying to create a game that focuses on a community focused game set in a cave and dungeon semi-procedurally generated environment that shifts and evolves according to the players' actions. Another primary goal is to create a game where players who have started later or earlier should have relatively the same opportunities. 

== Game Design
#name is a game with a browser-based client where players can play with any party size, featuring procedurally generated dungeons/caves that will shift and evolve over time. The heart of #name is the way that our randomly generated dungeons work. Our dungeons and caves can be categorized as a series/map of nodes, in which rooms, corridors, traps, treasures, monsters and stairways will be randomly placed. 

There is a day-night cycle local to each party that incentivizes not staying the night within the cave - the passages will rearrange and entities will respawn overnight. There are also two additional metrics to enforce this - being sanity, which will decrease from "horrific" events that occur (encountering entities) or stressful situations, and inventory capacity units. 

To circumvent the randomly generated passages and encourage community building, players can buy magical maps which will record a set passage. Within the game environment, this will lock the path of nodes that the player has traversed so that it would not be rearranged. Players can route and annotate rooms using these magical maps. You can use these maps to travel back to the player hub, and sell this to other players. However, you can make fake maps. Although maps will only show the route of nodes, players can mislead each other by not annotating the difficulty of node paths or certain strategies to avoid. 

== Why

/ why `rear-end`?: because it's funny

/ why hard tabs?: because nick wanted it so

/ why gltf?: because blender exports it, and the format was designed to be easily parsed by javascript. `.glb` was chosen because it packages the entire model into one file that is easy to move around 

/ why `Server` vs `WsServer`?: this is legacy code that nick copied from cse 125, where sean had a web-worker-based mock for the http server that allowed it to be run in the browser on github pages for preview purposes (in case the deployed server went down, which it did)

/ why are messages like this?: we arent using socket.io or whatever because why? raw websockets are usable enough. plus, our setup allows for strongly typing the messages, reaping the benefits

  in socket libraries you can send events like `.emit('gameStateUpdate')` or something, but events in general are hard to type in typescript

  rather, we have a central message handler. an internal class that has direct access to the websocket object parses it as JSON; this allows us to replace the encoding with raw bytes (byte marshalling? idk) for smaller packets.

  then, outside of this websocket wrapper, we have a message handler function that gets a typed object that we can then `switch`-`case` over. no need to scratch head figuring out what format the message will be in since we have types defined for every message!
