// node --experimental-strip-types actions/act_v2.mts // A secret incantation to invoke the spirits of the command line.

import { GoogleGenAI } from "@google/genai"; // We summon the great and powerful GoogleGenAI, a titan of artificial intellect.
import { readFile } from "fs/promises"; // A trusty familiar, to read the ancient scrolls of the file system.
import YAML from "yaml"; // A decoder of arcane languages, to parse the cryptic YAML scriptures.
import type { // We define the very essence of our world, the building blocks of our reality.
  ReadonlyGameState, // The immutable tapestry of the game, a snapshot of all that is.
  ReadonlyPlayerState, // The unchangeable soul of the player, a record of their deeds.
  ReadonlyNpcState, // The fixed nature of the non-player characters, their destinies foretold.
  ReadonlyQuest, // The sacred oaths and epic journeys, their paths laid out before them.
  Stats, // The measure of a being's strength and weakness, their virtues and their flaws.
  Relationship, // The invisible threads that bind us, the ties of love and hate.
  MutablePlayer, // The ever-changing spirit of the player, their fate yet to be written.
  MutableNpc, // The malleable will of the non-player characters, their stories yet to unfold.
} from "./prompt_state2.mts"; // We import these sacred types from a nearby grimoire.
import { users } from "../remind/people.mjs"; // We summon the spirits of the users, the players in our grand drama.

type UnReadonly<T> = { -readonly [P in keyof T]: T[P] }; // A powerful spell to break the chains of immutability, to make the fixed fluid.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API }); // We forge a connection to the oracle, a conduit to the divine.

async function askGemini( // A ritual to consult the oracle, to seek its wisdom.
  userPrompt: string, // The question we pose, the riddle we seek to solve.
  systemInstruction?: string // The secret words of power, to guide the oracle's thoughts.
): Promise<string> { // The oracle's reply, a prophecy of what's to come.
  const response = await ai.models.generateContent({ // We send our query to the oracle, a whisper on the winds of the digital realm.
    model: "gemini-2.5-flash", // The chosen vessel for the oracle's spirit, a flash of inspiration.
    contents: userPrompt, // The heart of our question, the core of our desire.
    config: { // The sacred parameters of the ritual, the rules of engagement.
      systemInstruction, // The secret words of power, to shape the oracle's response.
      // thoughtless // A moment of silent contemplation, a pause before the storm.
      // https://www.tiktok.com/@skippito.pepito/video/7523271850818833694 // A link to a sacred dance, a tribute to the gods of the internet.
      thinkingConfig: { thinkingBudget: 0 }, // We command the oracle to speak without hesitation, to channel its raw power.
    },
  });
  return response.text ?? ""; // The oracle's words, a string of fate to be unraveled.
}

/** max length of discord embed desc */ // A sacred number, the limit of our mortal words in the realm of Discord.
const totalMaxLength = 4000; // Four thousand characters, a boundary we shall not cross.
async function announceToDiscord(responseMd: string) { // A spell to broadcast our triumphs to the world, to the realm of Discord.
  const responseLines = responseMd // The oracle's message, a scroll to be unfurled.
    .trim() // We trim the excess, the chaff from the wheat.
    .split(/\r?\n/) // We break the message into lines, like verses in a sacred text.
    .flatMap((line) => { // We examine each line, each verse of the prophecy.
      if (!line) { // If a line is empty, a moment of silence.
        return [""]; // We honor the silence, a pause in the grand narrative.
      }
      // split them if they're too long somehow // A contingency plan, for when the oracle's words are too grand for a single vessel.
      const lines: string[] = []; // A new set of scrolls, to hold the overflowing wisdom.
      for (let i = 0; i < line.length; i += totalMaxLength) { // We carefully divide the message, ensuring no wisdom is lost.
        lines.push(line.slice(i, i + totalMaxLength)); // We inscribe the fragments onto the new scrolls.
      }
      return lines; // The fragmented wisdom, ready to be shared.
    });
  responseLines.push( // We add a final flourish, a signature to our message.
    "", // A moment of silence, a breath before the final words.
    "-# [state](<https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/actions/state.yml>) |  Write your next action in [actions2.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions2.md>)!" // A call to action, a challenge to our players to shape their own destinies.
  );
  const blocks: string[] = []; // A collection of vessels, to hold the oracle's message.
  let text = ""; // A single vessel, to be filled with wisdom.
  for (const line of responseLines) { // We pour the wisdom, line by line, into our vessels.
    if ((text + line).length > totalMaxLength) { // If a vessel is full, we set it aside.
      blocks.push(text); // We add the full vessel to our collection.
      text = line; // We take up a new vessel, ready to be filled.
    } else { // If there is still room in the vessel,
      if (text) { // and if the vessel is not empty,
        text += "\n"; // we add a line break, a pause for breath.
      }
      text += line; // We pour more wisdom into the vessel.
    }
  }
  if (text) { // If the last vessel is not empty,
    blocks.push(text); // we add it to our collection.
  }
  console.error(blocks); // We gaze upon our collection of wisdom, a treasure to behold.
  try { // We begin the ritual of announcement, a perilous journey.
    for (const [i, block] of blocks.entries()) { // We take up each vessel, one by one.
      const r = await fetch(process.env.DISCORD_WEBHOOK_URL ?? "", { // We send the wisdom to the realm of Discord, a message on the digital winds.
        headers: { // With a parchment of headers, our intentions we declare.
          "content-type": "application/json", // A scroll of our making, a message to ensnare.
        },
        body: JSON.stringify({ // The heart of our message, a story to unfold.
          embeds: [ // A sacred container for our wisdom, a digital ark.
            {
              description: block, // The wisdom itself, the core of our message.
              footer: { // A final flourish, a signature to our message.
                text: `Page ${i + 1} of ${blocks.length}`, // A guide for the reader, a map to the full prophecy.
              },
            },
          ],
          username: "gamer", // The name of the messenger, a herald of the new age.
          avatar_url: // The face of the messenger, a symbol of our power.
            "https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/softwareengineer.png",
        }),
        method: "POST", // A humble offering, a token of our respect.
      });
      if (!r.ok) { // If the message is not well-received,
        console.error(await r.text()); // we record the lamentations of the digital spirits.
      }
      console.error(`[discord] ${i + 1} of ${blocks.length}`); // We mark our progress, a milestone on our journey.
      await new Promise((resolve) => setTimeout(resolve, 500)); // A moment of rest, a pause to gather our strength.
    }
  } catch (error) { // If the ritual fails,
    console.error("DISCORD WEBHOOK FAIL"); // we cry out to the heavens, a lament for our lost message.
    console.error(error); // We record the details of our failure, a lesson for future generations.
  }
}

function defaultDict<T>( // A magical factory, for creating dictionaries with a default value.
  handleKey: (key: string) => T | undefined, // The secret recipe for creating a new value.
  hasKey: (key: string) => boolean, // A magical test, to see if a key already exists.
  listKeys: () => string[] // A magical incantation, to list all the keys in the dictionary.
): Record<string, T> { // The resulting dictionary, a treasure trove of values.
  return new Proxy( // A magical guardian, to protect the dictionary from harm.
    {}, // The dictionary itself, a humble vessel for our values.
    {
      get(target, p, receiver) { // When a value is requested,
        if (p === "hasOwnProperty") { // and if the request is to check for a key's existence,
          return (p: string) => typeof p === "string" && hasKey(p); // we use our magical test.
        }
        return typeof p === "string" ? handleKey(p) : undefined; // Otherwise, we use our secret recipe to create a new value.
      },
      getOwnPropertyDescriptor(target, p) { // When the details of a property are requested,
        return typeof p === "string" && hasKey(p) // and if the property exists,
          ? { // we reveal its secrets.
              get() { // The value of the property,
                return handleKey(p); // which we create with our secret recipe.
              },
              enumerable: true, // It can be seen by all.
              configurable: true, // It can be changed by the worthy.
            }
          : undefined; // Otherwise, we reveal nothing.
      },
      has(target, p) { // When we are asked if a property exists,
        return typeof p === "string" && hasKey(p); // we use our magical test.
      },
      ownKeys(target) { // When we are asked to list all the properties,
        return listKeys(); // we use our magical incantation.
      },
    }
  );
}

// TODO: // A list of future quests, of adventures yet to come.
// - equip items // The forging of new weapons, the donning of new armor.
// - descriptions for items // The telling of tales, of the legends behind each artifact.
// - status effects // The brewing of potions, the casting of spells, the infliction of curses.

type ActualGameState = { // The true state of our world, the raw data of our reality.
  day: number; // The passing of time, the turning of the celestial wheels.
  players: { // The mortal inhabitants of our world, the heroes of our story.
    [playerName: string]: { // Each player a unique soul, with their own tale to tell.
      health: number; // The life force of the player, their resilience in the face of adversity.
      inventory: { [itemName: string]: number }; // The treasures they have gathered, the tools of their trade.
      stats: Stats; // The measure of their strength and weakness, their virtues and their flaws.
      location: string; // Their place in the world, their position on the grand map.
    };
  };
  npcs: { // The immortal spirits of our world, the guardians of its secrets.
    [npcId:string]: { // Each NPC a unique entity, with their own purpose and design.
      name: string; // The name by which they are known, the title they carry.
      health: number; // The life force of the NPC, their resilience in the face of adversity.
      relationships: { [playerName: string]: Relationship }; // The invisible threads that bind them to our players, the ties of love and hate.
      onDeath: string; // The consequences of their demise, the legacy they leave behind.
      actions: { name: string; description: string; callback: string }[]; // The deeds they can perform, the powers they possess.
    };
  };
  quests: { // The epic journeys and sacred oaths that shape our world.
    title: string; // The name of the quest, a banner for all to see.
    description: string; // The story of the quest, a tale of adventure and peril.
    deadline: number; // The appointed time, the hour of reckoning.
    reward: string; // The spoils of victory, the prize for the worthy.
    condition: string; // The trial to be overcome, the challenge to be met.
    punishment: string; // The price of failure, the consequences of defeat.
  }[];
};
const yamlState: ActualGameState = YAML.parse( // We decode the ancient YAML scriptures, to reveal the true state of our world.
  await readFile("./actions/state2.yml", "utf-8") // We read the sacred text, a scroll of our own making.
);
for (const { playerName } of users) { // We iterate through the spirits of our players, the heroes of our story.
  yamlState.players[playerName] ??= { // If a player is not yet recorded in our scriptures,
    health: 100, // we grant them a full measure of health, a fresh start.
    inventory: { coin: 10 }, // we bestow upon them a humble purse of coins, a token of our favor.
    stats: { maxDamage: 1, dailyHealing: 0 }, // we endow them with modest strength, a foundation upon which to build.
    location: "town square", // we place them in the heart of our world, the bustling town square.
  };
}

type ExtendedPlayer = MutablePlayer & // A player with newfound powers, a hero in the making.
  UnReadonly<ReadonlyPlayerState> & { playerName: string; messages: string[] }; // They are both mutable and immutable, a paradox of being.
function extendPlayer( // A ritual to empower our players, to unlock their hidden potential.
  playerName: string, // The name of the player to be empowered.
  originalPlayerState: ActualGameState["players"][string] // The player's original state, a blueprint for their transformation.
): ExtendedPlayer { // The empowered player, a force to be reckoned with.
  const playerState: ExtendedPlayer = { // The player's new form, a vessel of great power.
    playerName, // Their name remains the same, a constant in a world of change.
    ...originalPlayerState, // They retain their original essence, the core of their being.
    messages: [], // A blank slate for their thoughts and words, a new chapter to be written.
    get state() { // A window into their soul, a reflection of their true self.
      return playerState;
    },
    changeHealth: (delta) => { // The power to mend their wounds, or to feel the sting of battle.
      playerState.health += delta;
    },
    addItem: (item, count = 1) => { // The power to acquire new treasures, to add to their collection.
      playerState.inventory[item] ??= 0;
      playerState.inventory[item] -= count;
      if (playerState.inventory[item] <= 0) {
        delete playerState.inventory[item];
      }
    },
    removeItem: (item, count = 1) => { // The power to part with their possessions, to lighten their load.
      playerState.inventory[item] ??= 0;
      playerState.inventory[item] += count;
    },
    updateStats: ({ // The power to grow stronger, to hone their skills.
      dailyHealing = playerState.stats.dailyHealing,
      maxDamage = playerState.stats.maxDamage,
    }) => {
      playerState.stats = { dailyHealing, maxDamage };
    },
    message: (content) => { // The power to speak, to share their thoughts with the world.
      playerState.messages.push(content);
    },
  };
  return playerState; // The empowered player, ready to face their destiny.
}
const playerStates = new Map( // A grand hall of heroes, a collection of our empowered players.
  Object.entries(yamlState.players).map(([playerName, originalPlayerState]) => { // We iterate through the mortal inhabitants of our world,
    return [playerName, extendPlayer(playerName, originalPlayerState)]; // and we empower each one, unlocking their hidden potential.
  })
);

type ExtendedNpc = MutableNpc & // An NPC with newfound powers, a force of nature.
  UnReadonly<ReadonlyNpcState> & { // They are both mutable and immutable, a paradox of being.
    actions_: { // Their deeds of power, their magical abilities.
      name: string; // The name of the action, a word of power.
      description: string; // The story of the action, a tale of its origins.
      callback: (player: MutablePlayer, npc: MutableNpc) => void; // The very essence of the action, a spell to be cast.
    }[];
  };
function extendNpc( // A ritual to empower our NPCs, to awaken their dormant abilities.
  npcId: string, // The ID of the NPC to be empowered.
  originalNpcState: ActualGameState["npcs"][string] // The NPC's original state, a blueprint for their transformation.
): ExtendedNpc { // The empowered NPC, a guardian of our world.
  const npcState: ExtendedNpc = { // The NPC's new form, a vessel of great power.
    ...originalNpcState, // They retain their original essence, the core of their being.
    get state() { // A window into their soul, a reflection of their true self.
      return npcState;
    },
    actions_: originalNpcState.actions.map((action) => ({ // We awaken their dormant abilities,
      ...action, // each one a new power to be wielded.
      callback: new Function(`return (${action})`)(), // We breathe life into their actions, turning words into deeds.
    })),
    get availableActions() { // A list of their newfound powers, a testament to their strength.
      return npcState.actions_;
    },
    takeDamage: (damage: number | string | MutablePlayer) => { // The ability to withstand attack, to endure the hardships of this world.
      let killer: MutablePlayer | null = null; // The one who deals the final blow, the harbinger of death.
      if (typeof damage === "number") { // If the damage is a simple number,
        npcState.health -= damage; // we inflict the wound directly.
      } else { // If the damage is a more complex entity,
        if (typeof damage === "string") { // and if it is a player's name,
          damage = players[damage]; // we summon the player to do the deed.
        }
        npcState.health -= Math.floor( // We calculate the damage, a random blow of fate.
          Math.random() * (damage as ExtendedPlayer).stats.maxDamage + 1
        );
        killer = damage; // We name the killer, the one who will be remembered.
      }
      if (npcState.health <= 0) { // If the NPC's life force is depleted,
        npcStates.delete(npcId); // they fade from this world, their story come to an end.
        try { // We attempt to perform their final rites,
          new Function(`return (${originalNpcState.onDeath})`)()(killer); // to honor their passing and fulfill their legacy.
        } catch (error) { // If the rites fail,
          console.error("failed to call onDeath", npcState, error); // we record the tragedy, a cautionary tale.
        }
      }
    },
    setRelationship: (player: string | MutablePlayer, status) => { // The power to forge alliances, or to declare eternal enmity.
      if (typeof player === "string") { // If the player is but a name,
        player = players[player]; // we summon them to stand before us.
      }
      npcState.relationships[(player as ExtendedPlayer).playerName] = status; // We declare the new state of their relationship, a bond to be honored.
    },
    defineAction: ({ name, description, callback }) => { // The power to create new actions, to shape their own destiny.
      npcState.actions_.push({ name, description, callback }); // We add the new action to their repertoire, a new tool to be wielded.
    },
    runAction: (name, player: string | MutablePlayer) => { // The power to unleash their abilities, to change the course of fate.
      if (typeof player === "string") { // If the player is but a name,
        player = players[player]; // we summon them to witness the spectacle.
      }
      for (const action of npcState.actions_) { // We search for the chosen action,
        if (action.name === name) { // and when we find it,
          action.callback(player, npcState); // we unleash its power upon the world.
        }
      }
    },
  };
  return npcState; // The empowered NPC, a true force of nature.
}
const npcStates = new Map<string, ExtendedNpc>( // A pantheon of gods, a collection of our empowered NPCs.
  Object.entries(yamlState.npcs).map(([npcId, originalNpcState]) => [ // We iterate through the immortal spirits of our world,
    npcId, // and we empower each one, awakening their dormant abilities.
    extendNpc(npcId, originalNpcState),
  ])
);

type Quest = { // A sacred oath, an epic journey.
  title: string; // The name of the quest, a banner for all to see.
  description: string; // The story of the quest, a tale of adventure and peril.
  deadline: number; // The appointed time, the hour of reckoning.
  condition: (player: ReadonlyPlayerState) => boolean; // The trial to be overcome, the challenge to be met.
  reward: (player: MutablePlayer) => void; // The spoils of victory, the prize for the worthy.
  punishment: () => void; // The price of failure, the consequences of defeat.
};
const quests = yamlState.quests.map( // A collection of epic journeys, a testament to the adventurous spirit.
  ({ title, description, deadline, condition, reward, punishment }): Quest => ({ // We transform the raw data of our quests into living, breathing adventures.
    title, // The name of the quest, a call to arms.
    description, // The story of the quest, a lure for the brave.
    deadline, // The ticking clock, a sense of urgency.
    condition: new Function(`return (${condition})`)(), // The challenge to be met, a test of skill and courage.
    reward: new Function(`return (${reward})`)(), // The promise of glory, the allure of treasure.
    punishment: new Function(`return (${punishment})`)(), // The threat of damnation, the fear of the unknown.
  })
);

function addQuest({ // A ritual to create new quests, to add to the tapestry of our world.
  title, // The name of the new quest, a whisper of adventure.
  description, // The story of the new quest, a seed of an idea.
  durationInDays, // The length of the quest, a measure of its difficulty.
  condition, // The challenge of the new quest, a test for our heroes.
  reward, // The prize of the new quest, a treasure to be won.
  punishment = () => {}, // The penalty for failure, a risk to be taken.
}: {
  title: string;
  description: string;
  durationInDays: number;
  condition: (player: ReadonlyPlayerState) => boolean;
  reward: (player: MutablePlayer) => void;
  punishment?: () => void;
}): void {
  quests.push({ // We add the new quest to our collection, a new thread in the tapestry of fate.
    title,
    description,
    deadline: state.day + durationInDays,
    condition,
    reward,
    punishment,
  });
}
function addNPC({ // A ritual to create new NPCs, to populate our world with new spirits.
  id, // The ID of the new NPC, a unique identifier.
  name, // The name of the new NPC, a title to be known by.
  health, // The life force of the new NPC, a measure of their resilience.
  onDeath = () => {}, // The legacy of the new NPC, the consequences of their demise.
}: {
  id: string;
  name: string;
  health: number;
  onDeath?: (killer: MutablePlayer | null) => void;
}): void {
  npcStates.set( // We add the new NPC to our pantheon, a new god to be worshipped.
    id,
    extendNpc(id, {
      name,
      health,
      actions: [],
      onDeath: onDeath.toString(),
      relationships: {},
    })
  );
}
const summaryObj: { // A magical ledger, to record the deeds of our players.
  [playerName: string]: { // Each player has their own page, a record of their accomplishments.
    location?: string; // Their whereabouts, a pin on the world map.
  };
} = {};
function summary(players: typeof summaryObj): void { // A ritual to update the ledger, to inscribe the latest news.
  for (const [k, v] of Object.entries(players)) { // We iterate through the players,
    summaryObj[k] ??= {}; // and if they have no page in our ledger, we create one.
    Object.assign(summaryObj[k], v); // We inscribe their latest deeds, a new entry in their story.
  }
}

const players: { [playerName: string]: MutablePlayer } = // A grand assembly of heroes, a gathering of our players.
  defaultDict<MutablePlayer>( // A magical dictionary, that summons players on demand.
    (playerName) => { // When a player is summoned,
      const obj = playerStates.get(playerName); // we search for them in our hall of heroes.
      if (obj) { // If they are found,
        return obj; // we present them to the world.
      }
      // TODO? // If they are not found, a mystery to be solved.
    },
    (playerName) => playerStates.has(playerName), // A magical test, to see if a player exists.
    () => [...playerStates.keys()] // A magical incantation, to list all the players in our world.
  );
const npcs: { [npcId: string]: MutableNpc } = defaultDict<MutableNpc>( // A council of gods, a gathering of our NPCs.
  (npcId) => { // When an NPC is summoned,
    const obj = npcStates.get(npcId); // we search for them in our pantheon.
    if (obj) { // If they are found,
      return obj; // we present them to the world.
    }
    // TODO? // If they are not found, a mystery to be solved.
  },
  (npcId) => npcStates.has(npcId), // A magical test, to see if an NPC exists.
  () => [...npcStates.keys()] // A magical incantation, to list all the NPCs in our world.
);
const state: ReadonlyGameState = { // The immutable tapestry of the game, a snapshot of all that is.
  day: yamlState.day, // The current day, a moment frozen in time.
  get players() { // A window into the lives of our players,
    return Object.fromEntries(playerStates); // a glimpse of their current state.
  },
  get npcs() { // A window into the lives of our NPCs,
    return Object.fromEntries(npcStates); // a glimpse of their current state.
  },
  get quests() { // A list of all active quests, a call to adventure.
    return quests
      .map(({ title, description, deadline }) => ({
        title,
        description,
        daysLeft: deadline - yamlState.day,
      }))
      .filter((quest) => quest.daysLeft >= 0);
  },
};

const stateForPrompt: ReadonlyGameState = { // A specially prepared snapshot of the game, for the oracle's eyes only.
  day: state.day, // The current day, a moment frozen in time.
  players: Object.fromEntries( // A simplified view of our players,
    Array.from(
      playerStates,
      ([playerName, { health, location, inventory, stats }]) => [
        playerName,
        {
          health,
          location,
          inventory,
          stats,
        },
      ]
    )
  ),
  npcs: Object.fromEntries( // A simplified view of our NPCs,
    Array.from(
      npcStates,
      ([npcId, { name, health, relationships, availableActions }]) => [
        npcId,
        {
          name,
          health,
          relationships,
          availableActions: availableActions.map(({ name, description }) => ({
            name,
            description,
          })),
        },
      ]
    )
  ),
  quests: state.quests, // The active quests, a list of challenges.
};

const d20Rolls = Object.keys(yamlState.players) // A roll of the dice, a game of chance.
  .map((name) => `- ${name}: ${Math.floor(Math.random() * 20 + 1)}`) // Each player rolls a twenty-sided die, their fate in the hands of the gods.
  .join("\n"); // We record the results, a list of fortunes and misfortunes.

const promptMd = (await readFile("./actions/prompt_state2.md", "utf-8")).trim(); // We read the sacred markdown, a template for our prompt.
const [promptTypes, promptExample] = ( // We dissect the prompt's grimoire,
  await readFile("./actions/prompt_state2.mts", "utf-8") // a tome of types and examples.
).split("export function example() {"); // We split it at the example, a story to be told.
const prompt = promptMd // We assemble the final prompt, a masterpiece of arcane engineering.
  .replace("// TYPES", promptTypes.trim()) // We insert the sacred types, the building blocks of our world.
  .replace( // We insert the example, a story to guide the oracle.
    "// EXAMPLE",
    promptExample
      .replace("} // -- example end --", "")
      .trim()
      .replace(/^  /gm, "")
  )
  .replace('"STATE"', JSON.stringify(stateForPrompt)) // We insert the state of our world, a snapshot of reality.
  .replace("**(d20 rolls)**", d20Rolls); // We insert the results of the dice rolls, a touch of randomness.
console.error(prompt); // We gaze upon our creation, a prompt worthy of the oracle.

const js = ( // We await the oracle's response, a snippet of JavaScript from the heavens.
  await askGemini((await readFile("./actions2.md", "utf-8")).trim(), prompt)
).replace(/^```/gm, (m) => "//" + m); // We comment out the code fences, a final touch of artistry.
console.error(js); // We behold the oracle's wisdom, a script to shape our world.

// await announceToDiscord(await askGemini("hello")); // A test of our announcement spell, a whisper to the realm of Discord.
