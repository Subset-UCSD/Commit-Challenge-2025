// @ts-check

import * as pluginImport from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(tseslint.configs.base, {
	languageOptions: {
		parserOptions: {
			project: true,
			tsconfigRootDir: import.meta.dirname,
		},
	},
	rules: {
		// "import/order": "warn",
		"unused-imports/no-unused-imports": "warn",
		"unused-imports/no-unused-vars": "off",
		"simple-import-sort/imports": "warn",
		"simple-import-sort/exports": "warn",
	},
	plugins: {
		"unused-imports": unusedImports,
		import: pluginImport,
		"simple-import-sort": simpleImportSort,
	},
	files: ["**/*.ts", "**/*.js"],
	ignores: ["dist/", "public/"],
});
