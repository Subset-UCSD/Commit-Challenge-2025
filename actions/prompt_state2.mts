export type ReadonlyGameState = Readonly<{
  /** Automatically incremented by the game engine. */
  day: number;
  players: { [playerName: string]: ReadonlyPlayerState };
  npcs: { [npcId: string]: ReadonlyNpcState };
  quests: ReadonlyQuest[];
}>;
export type ReadonlyPlayerState = Readonly<{
  health: number;
  location: string;
  inventory: { [itemName: string]: number };
  stats: Readonly<Stats>;
}>;
export type ReadonlyNpcState = Readonly<{
  name: string;
  health: number;
  /** Maps player name to their relationship status with this NPC. */
  relationships: { [playerName: string]: Relationship };
  availableActions: { name: string; description: string }[];
}>;
export type ReadonlyQuest = Readonly<{
  title: string;
  description: string;
  daysLeft: number;
}>;

export type Stats = {
  /** For every attack, a random number between 1 and `maxDamage` is chosen as the player's damage. */
  maxDamage: number;
  /** Amount of HP the player regains each day. */
  dailyHealing: number;
};
export type Relationship = "good" | "neutral" | "bad";

export interface MutablePlayer {
  /** Automatically updates when you call the other methods. */
  state: ReadonlyPlayerState;
  /** Adds `delta` HP to the player's health. `delta` may be negative. */
  changeHealth(delta: number): void;
  /** Add item(s) to the player's inventory. `count` defaults to 1. */
  addItem(itemName: string, count?: number): void;
  /** Remove item(s) from the player's inventory. `count` defaults to 1. Use `Infinity` to remove all of this item. */
  removeItem(itemName: string, count?: number): void;
  /** Sets stats to a new value. */
  updateStats(newStats: Partial<Stats>): void;
  /** Send a message to the player (seen by all players). Used to indicate when callbacks are called (see example). */
  message(content: string): void;
}

export interface MutableNpc {
  /** Automatically updates when you call the other methods. */
  state: ReadonlyNpcState;
  /** Pass a `Player` object to `damage` when the player attacks the NPC. The player's stats are used to calculate the damage. For environmental damage, pass a number to `damage` to subtract that amount of HP from the NPC's health. To heal, pass a negative number. */
  takeDamage(damage: MutablePlayer | number): void;
  /** Update the relationship/reputation status between the player and NPC. */
  setRelationship(player: MutablePlayer, status: Relationship): void;
  /** Define an action that can be performed between a player and the NPC. Use `description` to note to your future self what it does or should be used for. */
  defineAction(action: {
    name: string;
    description: string;
    callback: (player: MutablePlayer, npc: MutableNpc) => void;
  }): void;
  /** Run a defined NPC action with a target player. */
  runAction(actionName: string, player: MutablePlayer): void;
}

/** Yesterday's game state. You MUST NOT directly write to this object; instead, use the methods below. */
export declare const state: ReadonlyGameState;
/** Maps player name to player object. */
export declare const players: { [playerName: string]: MutablePlayer };
/** Maps NPC ID to NPC object. */
export declare const npcs: { [npcId: string]: MutableNpc };

/** Registers a quest. At the end of every day, `condition` will be run on each player; if it returns true, they have completed the quest, and `reward` is called on that player. After `duration` days, the quest expires and is deleted. If no players complete the quest when it expires, `punishment` is called (if defined). */
export declare function addQuest(quest: {
  title: string;
  description: string;
  durationInDays: number;
  condition: (player: ReadonlyPlayerState) => boolean;
  reward: (player: MutablePlayer) => void;
  punishment?: () => void;
}): void;

/** Registers an NPC and adds it to `npcs[id]`. `name` is shown to players; `id` is used in the game state. When killed, `onDeath` is called with the player (if defined, and killed by a player). */
export declare function addNPC(npc: {
  id: string;
  name: string;
  health: number;
  onDeath?: (killer: MutablePlayer | null) => void;
}): void;

/** MUST BE CALLED ONCE AT THE END. `players` is a map of each player name to their current location. If the player's location does not change, you still must pass an empty object for that player. */
export declare function summary(players: {
  [playerName: string]: {
    location?: string;
  };
}): void;

export function example() {
  // Billy buys an apple from the farmer
  players["Billy"].removeItem("coin", 5);
  players["Billy"].addItem("apple");
  npcs["apple_farmer"].setRelationship(players["Billy"], "good");

  // An ogre appears in the pub
  addNPC({
    id: "pub_ogre_1",
    name: "Pungent Pub Ogre",
    health: 40,
    onDeath: (killer) => {
      if (killer) {
        killer.addItem("ogre snot", 3);
        killer.message("You collect snot from the ogre's body.");
      }
    },
  });
  // The next day, if a player tries to negotiate, you can run
  // npcs.pub_ogre_1.runAction("negotiate", players.PlayerName);
  npcs["pub_ogre_1"].defineAction({
    name: "negotiate",
    description: "If the player tries to talk to the ogre, run this.",
    callback: (player, ogre) => {
      player.message("The ogre is not open to negotiation.");
    },
  });
  addQuest({
    title: "Ogre Incident",
    description:
      "There is an ogre in the pub. They will give you 50 coins if you kill it.",
    durationInDays: 3,
    condition: (player) =>
      player.location === "pub" && npcs["ogre1"].state.health <= 0,
    reward: (player) => {
      player.addItem("coin", 50);
      player.message("The village thanks you for defeating the ogre.");
    },
    punishment: () => {
      for (const player of Object.values(players)) {
        if (player.state.location === "pub") {
          player.changeHealth(-20);
          player.message("The ogre attacks you! -20 HP");
        }
      }
    },
  });

  // Required summary: Sally goes to the pub
  summary({
    Billy: {},
    Sally: { location: "pub" },
  });
} // -- example end --
