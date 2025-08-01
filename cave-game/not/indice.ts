import { Router } from "express";

export function thing(): Router {
	const router = Router();
	router.use((req, res, next) => {
		res.send("fuck");
	});
	return router;
}
