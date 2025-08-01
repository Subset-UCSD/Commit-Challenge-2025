import express from "express";

import { thing } from "./indice";

const app = express();

app.use("/not", thing());

app.listen(8080, () => console.log("http://localhost:8080/"));
