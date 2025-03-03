// @ts-check

import fs from "fs";
import { discords } from "./people.mjs";

const commits = JSON.parse(fs.readFileSync("commits.json", "utf-8"));

const everyone = Object.keys(discords);
const committers = [...new Set(commits.map((commit) => commit.author?.login))]
  .sort()
  .filter((ghUser) => discords[ghUser]);
const nonCommitters = everyone.filter((user) => !committers.includes(user));

function select(...choices) {
  return choices[Math.floor(Math.random() * choices.length)];
}

/** @type {Record<string, string>} */
const messages = Object.fromEntries(
  nonCommitters.map((ghUser) => [
    discords[ghUser],
    (committers.length > 0
      ? select(
          "{PPL} all comited to the [repo](REPO)!! and 🫵YOU did not 😡",
          "why havent u commited to the [repo](REPO) today? {PPL} has, go be like them !",
          "🚨this is ur daily remind to comit to [REPO](REPO) ! {PPL} alr did",
          "{PPL} committed to the [repository](REPO) today. Why haven't you?",
          "{PPL} and you have added a fish to the [aqaurium](README) today thanks!.. oh wait, YOU didnt 🫵🤓",
          "||{PPL}||",
          "hi . {PPL} already committed. [u could too](REPO)",
          "haha {PPL} committed to the [repo](REPO) today.. what a bunch of nerds 🤓👎👎 ,, imagine COMMITING EVERY DAY 👈🤣",
          "{PPL}.. do u recognize this list? thats right, thats todays [NERD LIST](REPO) 😆😅🤣😂",
          "todays red flag 🚩 : commiting to the 🤓[nerd repo](REPO)🤓\n\nwhos the red flag today? 🥁🥁🥁 ||{PPL}||",
          "did you know? your tongue has five parts that each taste a different taste: {PPL} [[1]](REPO)",
          "help us make [acm bank](REPO)",
          "{PPL} have phones.. do u? u know u can edit [files](REPO) on ur phone right",
          "help ",
          "open [this](README) on ur phone, try adding an emoji or making fun of {PPL} or smth",
          "hey [check out what](WEB) {PPL} made",
          "u could change [the image](WEB) that {PPL} added",
          "help {PPL} make an [aquarium!](WEB)!",
          "listen to [this song](WEB) that {PPL} made",
        )
      : select(
          "you could be the first comiter of the day!!",
          "go be the first 💪 comiter ",
          "i dare you to commmit to [repo](REPO)",
          "You forgot to commit to the [repository](REPO) today. You know what happens now.",
          "new day new fish for [quarium](README)",
          "skat[e](REPO)bpard",
          "hi . [commit now](REPO)",
          "no one commited to the [repo](REPO) today thank god",
          "red flag of the day🚩: commiting to [github](REPO).. hope to god YOU dont do that today ..haha",
          "i-\n\nfuck",
          "heyyy dont forget about the [commit chlalenge](REPO)s",
          "👁️👄👁️ [dsfkhdfgbdsfg](REPO)",
          "i give up",
          "r u on ur phone? u could add smth to the [readme](README)",
          "can u open [this](README) on ur phone?",
          "drop a spotify link [here](README)",
          "pay your [cat tax](REPO) 🤌",
          "u know what we need? an aquarium. [add one pls🐟](WEB)",
          "[listen to this](WEB) ((audio on))",
        )
    )
      .replaceAll(
        "(REPO)",
        "(<https://github.com/Subset-UCSD/Commit-Challenge-2025/>)"
      )
      .replaceAll(
        "(README)",
        "(<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/README.md>)"
      )
      .replaceAll(
        "(WEB)",
        "(https://subset-ucsd.github.io/Commit-Challenge-2025/)"
      )
      .replaceAll(
        "{PPL}",
        committers.map((ghUser) => `<@${discords[ghUser]}>`).join(" and ")
      ),
  ])
);
console.log(messages);
fs.writeFileSync("messages.json", JSON.stringify(messages));

if (nonCommitters.length > 0) {
  await fetch(process.env.DISCORD_WEBHOOK_URL || '', {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify({"content":
      `hey ${nonCommitters.map(ghUser => `<@${discords[ghUser]}>`).join(' ')} (especially if ur on a phone) can u [add the next word to this](<https://github.com/Subset-UCSD/Commit-Challenge-2025/edit/main/gpt.txt>) ${select(
        'help us be chatgpt',
        '🤨',
        '... or u cant..?',
        '🫦',
        '🫵',
        'r u smarter than an llm ?',
        '老天保佑金山银山前路有',
        '[object Object]',
      )}`
      ,"username":"reminder","avatar_url":"https://subset-ucsd.github.io/Commit-Challenge-2025/ass/ets/mayo.png"}),
    "method": "POST",
  }).catch(console.log);
}

const BASH_TRUE = 0;
const BASH_FALSE = 1;

// Return true iff everyone already committed
process.exit(nonCommitters.length === 0 ? BASH_TRUE : BASH_FALSE);

