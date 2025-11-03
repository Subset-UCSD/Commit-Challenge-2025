import fs from "fs";
import { discords } from "./people.mjs";
import { type Article, getTopStories } from "./read-news.mts";

type Commit = {
  url: string;
  sha: string;
  node_id: string;
  html_url: string;
  comments_url: string;
  commit: {
    url: string;
    author:
      | null
      | {
          name?: string;
          email?: string;
          date?: string;
        };
    committer:
      | null
      | {
          name?: string;
          email?: string;
          date?: string;
        };
    message: string;
    comment_count: number;
    tree: {
      sha: string;
      url: string;
    };
    verification: {
      verified: boolean;
      reason: string;
      payload: string | null;
      signature: string | null;
      verified_at: string | null;
    };
  };
  author:
    | null
    | {
        name?: string | null;
        email?: string | null;
        login?: string;
        id?: number;
        node_id?: string;
        avatar_url?: string;
        gravatar_id?: string | null;
        url?: string;
        html_url?: string;
        followers_url?: string;
        following_url?: string;
        gists_url?: string;
        starred_url?: string;
        subscriptions_url?: string;
        organizations_url?: string;
        repos_url?: string;
        events_url?: string;
        received_events_url?: string;
        type?: string;
        site_admin?: boolean;
        starred_at?: string;
        user_view_type?: string;
      }
    //| {};
  committer:
    | null
    | {
        name?: string | null;
        email?: string | null;
        login?: string;
        id?: number;
        node_id?: string;
        avatar_url?: string;
        gravatar_id?: string | null;
        url?: string;
        html_url?: string;
        followers_url?: string;
        following_url?: string;
        gists_url?: string;
        starred_url?: string;
        subscriptions_url?: string;
        organizations_url?: string;
        repos_url?: string;
        events_url?: string;
        received_events_url?: string;
        type?: string;
        site_admin?: boolean;
        starred_at?: string;
        user_view_type?: string;
      }
    | {};
  parents: {
    sha: string;
    url: string;
    html_url?: string;
  }[];
  stats?: {
    additions?: number;
    deletions?: number;
    total?: number;
  };
  files?: {
    sha?: string;
    filename?: string;
    status?: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
    additions?: number;
    deletions?: number;
    changes?: number;
    blob_url?: string;
    raw_url?: string;
    contents_url?: string;
    patch?: string;
    previous_filename?: string;
  }[];
};

const commits: Commit[] = JSON.parse(fs.readFileSync("commits.json", "utf-8"));

const everyone = Object.keys(discords);
const committers = [...new Set(commits.map((commit) => commit.author?.login))]
  .sort()
  .filter((ghUser): ghUser is string => ghUser !== undefined && discords[ghUser] !== undefined);
const nonCommitters = everyone.filter((user) => !committers.includes(user));
const commiterCount = everyone.length - nonCommitters.length

function select<T>(...choices: T[]): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

/** shuffles in place */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i--;) {
    const index = Math.floor(Math.random() * (i + 1));
    if (i !== index)
    [array[i], array[index]] = [array[index], array[i]]
  }
  return array
}

const wolrdNews = (await getTopStories('world')).results ?? []
const usNews = (await getTopStories('us')).results ?? []
console.error(wolrdNews, usNews)

const processNews = (arr: Article[]) => arr
.map(article => `- ${article.title}: ${article.abstract}`)
.join('\n')
//const news = [...process((await getTopStories('us')).results ?? []), ...process((await getTopStories('world')).results ?? [])]
// .map(article => article.title.toLowerCase().replace(/[^a-z ]/g, ''))
// .join(', ')
// .map(article => `[${article.title}](${article.url}): ${article.abstract}`)
// .join(' • ')
//console.error(news)
const result:string = (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`, {
    "headers": {
      "content-type": "application/json",
    },
    method: 'POST',
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: //`Summarize the U.S. and world news, each in their own limericks, written in all lowercase. Don't say anything else; just output the first limerick, then the second limerick.
`Cleverly incorporate the U.S. and world news into an appeal requesting friends to play Peak (game description provided below; we already have it installed). Also, recommend a second multiplayer game to play based on the current national day (i.e. "National/International ___ Day") occuring today. Use an informal Discord message format with lowercase, typos, and internet slang.

# World news

${processNews(wolrdNews)}

# US news

${processNews(usNews)}

# Peak game description

PEAK is a co-op climbing game where the slightest mistake can spell your doom. Either solo or as a group of lost nature scouts, your only hope of rescue from a mysterious island is to scale the mountain at its center. Do you have what it takes to reach the PEAK?

# Gameplay (from Wikipedia) 

The game supports up to four players, with the objective being to climb a mountain following a crash landing on an unknown island.[3][4] The map changes every 24 hours.[5] Players must also maintain a stamina bar, which is depleted as the player climbs the mountain.[6] Players can revive their teammates through several methods, including the use of altars found at campsites, which serve as rest area between levels.[7] Players can carry up to three items, and can use a backpack to carry up to four more.[8] Upon completing the default difficulty, players are awarded an in-game cosmetic sash, and unlock harder difficulties.[9]

There is a single enemy in game, named "Scoutmaster." It spawns when a player travels too far from the group, or when it is summoned through the use of an item, the "Scoutmaster Bugle."[10]

Outside of climbing the mountain, obstacles players can run into include ticks, which inflict poison damage to the affected player until a teammate removes the bug. They can be consumed, similar to other food-related items in the game.[11]

The game features various items that assist with climbing the mountain, including rope spools, rope cannons, and pitons. Rope spools can be deployed from elevated positions, allowing a rope to be lowered to assist other players in ascending. Rope cannons can be fired at a wall or ceiling and deploy a rope that drops down and can be climbed. Pitons can be placed onto any rock surface that the player can climb on and serve as rest locations for players. Players can interact with them to hold on and regain stamina.[12]`
            }
          ]
        }
      ]
    })
  }).then(r => r.json())).candidates[0].content.parts[0].text
// console.log(result)

function alternate<T>(a: T[], b: T[]): T[] {
  const items: T[] = []
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    items.push(a[i])
    items.push(b[i])
  }
  items.push(...a.slice(b.length, ),...b.slice(a.length))
  return items
}

const result2:string = (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`, {
    "headers": {
      "content-type": "application/json",
    },
    method: 'POST',
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Summarize each headline in two words, written in all lowercase. Separate each headline with a period. The words can be unnecessarily fancy and verbose, long, and obscure.

${processNews(alternate(wolrdNews, usNews))}`
            }
          ]
        }
      ]
    })
  }).then(r => r.json())).candidates[0].content.parts[0].text

const messages: Record<string, string> = Object.fromEntries(
  nonCommitters.map((ghUser) => [
    discords[ghUser],
    `${committers.length > 0 ? committers.map((ghUser) => `<@${discords[ghUser]}>`).join(" and ") : 'no one'} committed to the [repo](<https://github.com/Subset-UCSD/Commit-Challenge-2025/>). ${result2}`,
    // (committers.length > 0
    //   ? select(
    //       "{PPL} all comited to the [repo](REPO)!! and 🫵YOU did not 😡",
    //       "why havent u commited to the [repo](REPO) today? {PPL} has, go be like them !",
    //       "🚨this is ur daily remind to comit to [REPO](REPO) ! {PPL} alr did",
    //       "{PPL} committed to the [repository](REPO) today. Why haven't you?",
    //       "{PPL} and you have added a fish to the [aqaurium](README) today thanks!.. oh wait, YOU didnt 🫵🤓",
    //       "||{PPL}||",
    //       "hi . {PPL} already committed. [u could too](REPO)",
    //       "haha {PPL} committed to the [repo](REPO) today.. what a bunch of nerds 🤓👎👎 ,, imagine COMMITING EVERY DAY 👈🤣",
    //       "{PPL}.. do u recognize this list? thats right, thats todays [NERD LIST](REPO) 😆😅🤣😂",
    //       "todays red flag 🚩 : commiting to the 🤓[nerd repo](REPO)🤓\n\nwhos the red flag today? 🥁🥁🥁 ||{PPL}||",
    //       "did you know? your tongue has five parts that each taste a different taste: {PPL} [[1]](REPO)",
    //       "help us make [acm bank](REPO)",
    //       "{PPL} have phones.. do u? u know u can edit [files](REPO) on ur phone right",
    //       "help ",
    //       "open [this](README) on ur phone, try adding an emoji or making fun of {PPL} or smth",
    //       "hey [check out what](WEB) {PPL} made",
    //       "u could change [the image](WEB) that {PPL} added",
    //       "help {PPL} make an [aquarium!](WEB)!",
    //       "listen to [this song](WEB) that {PPL} made",
    //       '{PPL} commited to the repo and YOU didnt.. CRINGE',
    //     )
    //   : select(
    //       "you could be the first comiter of the day!!",
    //       "go be the first 💪 comiter ",
    //       "i dare you to commmit to [repo](REPO)",
    //       "You forgot to commit to the [repository](REPO) today. You know what happens now.",
    //       "new day new fish for [quarium](README)",
    //       "skat[e](REPO)bpard",
    //       "hi . [commit now](REPO)",
    //       "no one commited to the [repo](REPO) today thank god",
    //       "red flag of the day🚩: commiting to [github](REPO).. hope to god YOU dont do that today ..haha",
    //       "i-\n\nfuck",
    //       "heyyy dont forget about the [commit chlalenge](REPO)s",
    //       "👁️👄👁️ [dsfkhdfgbdsfg](REPO)",
    //       "i give up",
    //       "r u on ur phone? u could add smth to the [readme](README)",
    //       "can u open [this](README) on ur phone?",
    //       "drop a spotify link [here](README)",
    //       "pay your [cat tax](REPO) 🤌",
    //       "u know what we need? an aquarium. [add one pls🐟](WEB)",
    //       "[listen to this](WEB) ((audio on))",
    //     )
    // )
    //   .replaceAll(
    //     "(REPO)",
    //     "(<https://github.com/Subset-UCSD/Commit-Challenge-2025/>)"
    //   )
    //   .replaceAll(
    //     "(README)",
    //     "(<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/README.md>)"
    //   )
    //   .replaceAll(
    //     "(WEB)",
    //     "(https://subset-ucsd.github.io/Commit-Challenge-2025/)"
    //   )
    //   .replaceAll(
    //     "{PPL}",
    //     committers.map((ghUser) => `<@${discords[ghUser]}>`).join(" and ")
    //   ),
  ])
);
console.log(messages);
fs.writeFileSync("messages.json", JSON.stringify(messages));

const nonCommittersClone = [...nonCommitters]
if (commiterCount >= 3) {
await fetch(process.env.DISCORD_WEBHOOK_URL || '', {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify({"content":
     `${commiterCount} ppl committed and have spared this channel from the news.. ignorance is strength. but ${nonCommitters.map(ghUser => `<@${discords[ghUser]}>`).join(' ')} did not comit......`
,
      "username":"reminder","avatar_url":"https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/mayo.png"}),
    "method": "POST",
  }).catch(console.log);
} else
if (nonCommitters.length > 0) {
  const lines = result.trim().split(/\r?\n/)
  shuffle(nonCommitters)
let out = ''
for (const line of lines) {
if (line.trim()) {
  const next = nonCommitters.pop()
  out += `${line}${next ? ` <@${discords[next]}>` : ''}\n`
} else {
  out += '\n'
}
}
  await fetch(process.env.DISCORD_WEBHOOK_URL || '', {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify({"content":
      `${out}\nits summer! to turn off the news, 3+ ppl must commit ${nonCommitters.map(ghUser => `<@${discords[ghUser]}>`).join(' ')}`,
      // `hey ${nonCommitters.map(ghUser => `<@${discords[ghUser]}>`).join(' ')} (especially if ur on a phone) can u [add the next word to this](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/actions.md>) ${select(
      //   'help us be chatgpt',
      //   '🤨',
      //   '... or u cant..?',
      //   '🫦',
      //   '🫵',
      //   'r u smarter than an llm ?',
      //   '老天保佑金山银山前路有',
      //   '[object Object]',
      // )}`
      // ,
      "username":"reminder","avatar_url":"https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/mayo.png"}),
    "method": "POST",
  }).catch(console.log);
}

const BASH_TRUE = 0;
const BASH_FALSE = 1;

// Return true iff everyone already committed
process.exit(nonCommittersClone.length === 0 ? BASH_TRUE : BASH_FALSE);

