/** 
 * Each stage should be a PURE function, so expect it to be called many times.
 * If you want to change game state, do it in `choices`.
 */
export type Stage = () => StageInfo;

export type StageInfo = {
	/** 
	 * Short description of where the player is. Displayed at the top and in the
	 * tab title. Can use HTML.
	 */
	location: string
	/** Class applied to `:root` to change the color scheme */
	theme?: string
	/**
	 * Text shown before the choices. Can use HTML.
	 */
	description: string
	/**
	 * Input shown before choices. Can use HTMLL.
	 */
	inputs?: string
	/**
	 * An object mapping from a string label (which can use HTML) to a function.
	 * The function can either be
	 *
	 * - another stage (i.e. a PURE FUNCTION)
	 *
	 * - a function that returns a string or a stage (i.e. a function returning
	 *   function). use this for any game state changes, like adding items to an
	 *   inventory.
	 *
	 *   Return value:
	 *   - string -> it will be displayed (can use HTML) with a single choice "ok"
	 *     to return back to the same stage.
	 *   - stage -> it will run the action then display the stage
	 *   - null -> indicates we are exiting "choose-your-own-adventure" mode
	 *
	 * Specifying a choice of `null` will hide the choice. This can be used to
	 * specify the order of the choices in the object but programmatically
	 * show/hide them later in the function.
	 */
	choices: {
		[choiceLabel: string]: Stage | (() => string | Stage | null) | null
	}
}

export type Item = {
	/** 
	 * Should serve as both the ID and display name of the item. If we want to
	 * separate the two, we can add an optional `displayName` property in the
	 * future.
	 * 
	 * Can use HTML.
	 */
	name: string
	/**
	 * Can use HTML.
	 */
	lore?: string
}
