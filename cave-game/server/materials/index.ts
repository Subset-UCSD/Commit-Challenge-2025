import { ContactMaterial, Material } from "cannon-es";

export const mats = {
	player: new Material("player"),
	ground: new Material("ground"),
	slippery: new Material("slippery"),
};

// whenever a new CM is added, a new line needed to be added to the world initialization in TheWorld to add the contact material
export const contact = {
	"player-ground": new ContactMaterial(mats.player, mats.ground, {
		friction: 0,
		restitution: 0,
		contactEquationStiffness: 1e8,
		contactEquationRelaxation: 4,
	}),
	"player-player": new ContactMaterial(mats.player, mats.player, {
		friction: 0.2,
	}),

	"slippery-ground": new ContactMaterial(mats.slippery, mats.ground, {
		friction: 0.05,
	}),

	"player-slippery": new ContactMaterial(mats.player, mats.slippery, {
		friction: 0,
	}),
};
