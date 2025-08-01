import express from "express";

const app = express();

app.use((req, res, next) => {
	res.send("fuck");
});

app.listen(8081, () => console.log("http://localhost:8081/"));
