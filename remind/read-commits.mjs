// @ts-check

import fs from "fs";

const commits = JSON.parse(fs.readFileSync("commits.json", "utf-8"));

const discords = {
  NolanChai: 135882546440306688,
  SheepTester: 212355530474127361,
  Sean1572: 254847696592961537,
  dowhep: 333255408582131725,
  "nick-ls": 303745722488979456,
  raymosun: 252303578792853514,
  khushijpatel: 784956933005508608,
  "3dcantaloupe": 357300903726022659,
};

const everyone = Object.keys(discords);
const committers = [...new Set(commits.map((commit) => commit.author?.login))]
  .sort()
  .filter((ghUser) => discords[ghUser]);
const nonCommitters = everyone.filter((user) => !committers.includes(user));

function select(...choices) {
  return choices[Math.floor(Math.random() * choices.length)];
}

const messages = Object.entries(
  nonCommitters.map((ghUser) => [
    discords[ghUser],
    (committers.length > 0
      ? select(
          "{PPL} all comited to the [repo](REPO)!! and 🫵YOU did not 😡",
          "why havent u commited to the [repo](REPO) today? {PPL} has, go be like them !",
          "🚨this is ur daily remind to comit to [REPO](REPO) ! {PPL} alr did",
          "{PPL} committed to the [repository](REPO) today. Why haven't you?",
          "{PPL} and you have added a fish to the [aqaurium](REPO) today thanks!.. oh wait, YOU didnt 🫵🤓",
          "||{PPL}||",
          "hi . {PPL} already committed. [u could too](REPO)",
          "haha {PPL} committed to the [repo](REPO) today.. what a bunch of nerds 🤓👎👎 ,, imagine COMMITING EVERY DAY 👈🤣",
          "{PPL}.. do u recognize this list? thats right, thats todays [NERD LIST](REPO) 😆😅🤣😂",
          "todays red flag 🚩 : commiting to the 🤓[nerd repo](REPO)🤓\n\nwhos the red flag today? 🥁🥁🥁 ||{PPL}||"
        )
      : select(
          "you could be the first comiter of the day!!",
          "go be the first 💪 comiter ",
          "i dare you to commmit to [repo](REPO)",
          "You forgot to commit to the [repository](REPO) today. You know what happens now.",
          "new day new fish for [quarium](REPO)",
          "skat[e](REPO)bpard",
          "hi . [commit now](REPO)",
          "no one commited to the [repo](REPO) today thank god",
          "red flag of the day🚩: commiting to [github](REPO).. hope to god YOU dont do that today ..haha"
        )
    )
      .replaceAll(
        "(REPO)",
        "(<https://github.com/Subset-UCSD/Commit-Challenge-2025/>)"
      )
      .replaceAll(
        "{PPL}",
        committers.map((ghUser) => `<@${discords[ghUser]}>`).join(" and ")
      ),
  ])
);
console.log(messages);
fs.writeFileSync("messages.json", JSON.stringify(messages));

const BASH_TRUE = 0;
const BASH_FALSE = 1;

// Return true iff everyone already committed
process.exit(nonCommitters.length === 0 ? BASH_TRUE : BASH_FALSE);
