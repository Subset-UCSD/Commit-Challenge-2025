export const users = [
  { github: "NolanChai", discord: "135882546440306688", playerName: "Nolan" },
  { github: "SheepTester", discord: "212355530474127361", playerName: "Sean_P" },
  { github: "Sean1572", discord: "254847696592961537", playerName: "Sean_Y" },
  { github: "dowhep", discord: "333255408582131725", playerName: "Marcelo" },
  { github: "nick-ls", discord: "303745722488979456", playerName: "Nick" },
  { github: "raymosun", discord: "252303578792853514", playerName: "Raymond" },
  { github: "khushijpatel", discord: "784956933005508608", playerName: "Khushi" },
  { github: "sprestrelski", discord: "139762231733780480", playerName: "sam" },
]

export const discords = Object.fromEntries(users.map(({ github, discord }) => [github, discord]));
