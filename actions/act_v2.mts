// node --experimental-strip-types actions/act_v2.mts

import { GoogleGenAI } from "@google/genai";
import { readFile } from "fs/promises";
import YAML from "yaml";
import type {
  ReadonlyGameState,
  ReadonlyPlayerState,
  ReadonlyNpcState,
  ReadonlyQuest,
  Stats,
  Relationship,
  MutablePlayer,
  MutableNpc,
} from "./prompt_state2.mts";
import { users } from "../remind/people.mjs";

type UnReadonly<T> = { -readonly [P in keyof T]: T[P] };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

async function askGemini(
  userPrompt: string,
  systemInstruction?: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction,
      // thoughtless
      // https://www.tiktok.com/@skippito.pepito/video/7523271850818833694
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return response.text ?? "";
}

/** max length of discord embed desc */
const totalMaxLength = 4000;
async function announceToDiscord(responseMd: string) {
  const responseLines = responseMd
    .trim()
    .split(/\r?\n/)
    .flatMap((line) => {
      if (!line) {
        return [""];
      }
      // split them if they're too long somehow
      const lines: string[] = [];
      for (let i = 0; i < line.length; i += totalMaxLength) {
        lines.push(line.slice(i, i + totalMaxLength));
      }
      return lines;
    });
  responseLines.push(
    "",
    "-# [state](<https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/actions/state.yml>) |  Write your next action in [actions2.md](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions2.md>)!"
  );
  const blocks: string[] = [];
  let text = "";
  for (const line of responseLines) {
    if ((text + line).length > totalMaxLength) {
      blocks.push(text);
      text = line;
    } else {
      if (text) {
        text += "\n";
      }
      text += line;
    }
  }
  if (text) {
    blocks.push(text);
  }
  console.error(blocks);
  try {
    for (const [i, block] of blocks.entries()) {
      const r = await fetch(process.env.DISCORD_WEBHOOK_URL ?? "", {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              description: block,
              footer: {
                text: `Page ${i + 1} of ${blocks.length}`,
              },
            },
          ],
          username: "gamer",
          avatar_url:
            "https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/softwareengineer.png",
        }),
        method: "POST",
      });
      if (!r.ok) {
        console.error(await r.text());
      }
      console.error(`[discord] ${i + 1} of ${blocks.length}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("DISCORD WEBHOOK FAIL");
    console.error(error);
  }
}

function defaultDict<T>(
  handleKey: (key: string) => T | undefined,
  hasKey: (key: string) => boolean,
  listKeys: () => string[]
): Record<string, T> {
  return new Proxy(
    {},
    {
      get(target, p, receiver) {
        if (p === "hasOwnProperty") {
          return (p: string) => typeof p === "string" && hasKey(p);
        }
        return typeof p === "string" ? handleKey(p) : undefined;
      },
      getOwnPropertyDescriptor(target, p) {
        return typeof p === "string" && hasKey(p)
          ? {
              get() {
                return handleKey(p);
              },
              enumerable: true,
              configurable: true,
            }
          : undefined;
      },
      has(target, p) {
        return typeof p === "string" && hasKey(p);
      },
      ownKeys(target) {
        return listKeys();
      },
    }
  );
}

// TODO:
// - equip items
// - descriptions for items
// - status effects

type ActualGameState = {
  day: number;
  players: {
    [playerName: string]: {
      health: number;
      inventory: { [itemName: string]: number };
      stats: Stats;
      location: string;
    };
  };
  npcs: {
    [npcId: string]: {
      name: string;
      health: number;
      relationships: { [playerName: string]: Relationship };
      onDeath: string;
      actions: { name: string; description: string; callback: string }[];
    };
  };
  quests: {
    title: string;
    description: string;
    deadline: number;
    reward: string;
    condition: string;
    punishment: string;
  }[];
};
const yamlState: ActualGameState = YAML.parse(
  await readFile("./actions/state2.yml", "utf-8")
);
for (const { playerName } of users) {
  yamlState.players[playerName] ??= {
    health: 100,
    inventory: { coin: 10 },
    stats: { maxDamage: 1, dailyHealing: 0 },
    location: "town square",
  };
}

type ExtendedPlayer = MutablePlayer &
  UnReadonly<ReadonlyPlayerState> & { playerName: string; messages: string[] };
function extendPlayer(
  playerName: string,
  originalPlayerState: ActualGameState["players"][string]
): ExtendedPlayer {
  const playerState: ExtendedPlayer = {
    playerName,
    ...originalPlayerState,
    messages: [],
    get state() {
      return playerState;
    },
    changeHealth: (delta) => {
      playerState.health += delta;
    },
    addItem: (item, count = 1) => {
      playerState.inventory[item] ??= 0;
      playerState.inventory[item] -= count;
      if (playerState.inventory[item] <= 0) {
        delete playerState.inventory[item];
      }
    },
    removeItem: (item, count = 1) => {
      playerState.inventory[item] ??= 0;
      playerState.inventory[item] += count;
    },
    updateStats: ({
      dailyHealing = playerState.stats.dailyHealing,
      maxDamage = playerState.stats.maxDamage,
    }) => {
      playerState.stats = { dailyHealing, maxDamage };
    },
    message: (content) => {
      playerState.messages.push(content);
    },
  };
  return playerState;
}
const playerStates = new Map(
  Object.entries(yamlState.players).map(([playerName, originalPlayerState]) => {
    return [playerName, extendPlayer(playerName, originalPlayerState)];
  })
);

type ExtendedNpc = MutableNpc &
  UnReadonly<ReadonlyNpcState> & {
    actions_: {
      name: string;
      description: string;
      callback: (player: MutablePlayer, npc: MutableNpc) => void;
    }[];
  };
function extendNpc(
  npcId: string,
  originalNpcState: ActualGameState["npcs"][string]
): ExtendedNpc {
  const npcState: ExtendedNpc = {
    ...originalNpcState,
    get state() {
      return npcState;
    },
    actions_: originalNpcState.actions.map((action) => ({
      ...action,
      callback: eval(`(${action})`),
    })),
    get availableActions() {
      return npcState.actions_;
    },
    takeDamage: (damage: number | string | MutablePlayer) => {
      let killer: MutablePlayer | null = null;
      if (typeof damage === "number") {
        npcState.health -= damage;
      } else {
        if (typeof damage === "string") {
          damage = players[damage];
        }
        npcState.health -= Math.floor(
          Math.random() * (damage as ExtendedPlayer).stats.maxDamage + 1
        );
        killer = damage;
      }
      if (npcState.health <= 0) {
        npcStates.delete(npcId);
        try {
          eval(`(${originalNpcState.onDeath})`)(killer);
        } catch (error) {
          console.error("failed to call onDeath", npcState, error);
        }
      }
    },
    setRelationship: (player: string | MutablePlayer, status) => {
      if (typeof player === "string") {
        player = players[player];
      }
      npcState.relationships[(player as ExtendedPlayer).playerName] = status;
    },
    defineAction: ({ name, description, callback }) => {
      npcState.actions_.push({ name, description, callback });
    },
    runAction: (name, player: string | MutablePlayer) => {
      if (typeof player === "string") {
        player = players[player];
      }
      for (const action of npcState.actions_) {
        if (action.name === name) {
          action.callback(player, npcState);
        }
      }
    },
  };
  return npcState;
}
const npcStates = new Map<string, ExtendedNpc>(
  Object.entries(yamlState.npcs).map(([npcId, originalNpcState]) => [
    npcId,
    extendNpc(npcId, originalNpcState),
  ])
);

type Quest = {
  title: string;
  description: string;
  deadline: number;
  condition: (player: ReadonlyPlayerState) => boolean;
  reward: (player: MutablePlayer) => void;
  punishment: () => void;
};
const quests = yamlState.quests.map(
  ({ title, description, deadline, condition, reward, punishment }): Quest => ({
    title,
    description,
    deadline,
    condition: eval(`(${condition})`),
    reward: eval(`(${reward})`),
    punishment: eval(`(${punishment})`),
  })
);

function addQuest({
  title,
  description,
  durationInDays,
  condition,
  reward,
  punishment = () => {},
}: {
  title: string;
  description: string;
  durationInDays: number;
  condition: (player: ReadonlyPlayerState) => boolean;
  reward: (player: MutablePlayer) => void;
  punishment?: () => void;
}): void {
  quests.push({
    title,
    description,
    deadline: state.day + durationInDays,
    condition,
    reward,
    punishment,
  });
}
function addNPC({
  id,
  name,
  health,
  onDeath = () => {},
}: {
  id: string;
  name: string;
  health: number;
  onDeath?: (killer: MutablePlayer | null) => void;
}): void {
  npcStates.set(
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
const summaryObj: {
  [playerName: string]: {
    location?: string;
  };
} = {};
function summary(players: typeof summaryObj): void {
  for (const [k, v] of Object.entries(players)) {
    summaryObj[k] ??= {};
    Object.assign(summaryObj[k], v);
  }
}

const players: { [playerName: string]: MutablePlayer } =
  defaultDict<MutablePlayer>(
    (playerName) => {
      const obj = playerStates.get(playerName);
      if (obj) {
        return obj;
      }
      // TODO?
    },
    (playerName) => playerStates.has(playerName),
    () => [...playerStates.keys()]
  );
const npcs: { [npcId: string]: MutableNpc } = defaultDict<MutableNpc>(
  (npcId) => {
    const obj = npcStates.get(npcId);
    if (obj) {
      return obj;
    }
    // TODO?
  },
  (npcId) => npcStates.has(npcId),
  () => [...npcStates.keys()]
);
const state: ReadonlyGameState = {
  day: yamlState.day,
  get players() {
    return Object.fromEntries(playerStates);
  },
  get npcs() {
    return Object.fromEntries(npcStates);
  },
  get quests() {
    return quests
      .map(({ title, description, deadline }) => ({
        title,
        description,
        daysLeft: deadline - yamlState.day,
      }))
      .filter((quest) => quest.daysLeft >= 0);
  },
};

const stateForPrompt: ReadonlyGameState = {
  day: state.day,
  players: Object.fromEntries(
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
  npcs: Object.fromEntries(
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
  quests: state.quests,
};

const d20Rolls = Object.keys(yamlState.players)
  .map((name) => `- ${name}: ${Math.floor(Math.random() * 20 + 1)}`)
  .join("\n");

const promptMd = (await readFile("./actions/prompt_state2.md", "utf-8")).trim();
const [promptTypes, promptExample] = (
  await readFile("./actions/prompt_state2.mts", "utf-8")
).split("export function example() {");
const prompt = promptMd
  .replace("// TYPES", promptTypes.trim())
  .replace(
    "// EXAMPLE",
    promptExample
      .replace("} // -- example end --", "")
      .trim()
      .replace(/^  /gm, "")
  )
  .replace('"STATE"', JSON.stringify(stateForPrompt))
  .replace("**(d20 rolls)**", d20Rolls);
console.error(prompt);

const js = (
  await askGemini((await readFile("./actions2.md", "utf-8")).trim(), prompt)
).replace(/^```/gm, (m) => "//" + m);
console.error(js);

// await announceToDiscord(await askGemini("hello"));
