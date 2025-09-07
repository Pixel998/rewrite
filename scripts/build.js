/**
 * @fileoverview Build script for the project. Because we are using a monorepo,
 * we need to build each package in the correct order. Otherwise, the type
 * definitions for the packages that depend on other packages won't be correct.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import { execSync } from "node:child_process";
import path from "node:path";
import { readFileSync } from "node:fs";
import {
	getPackageDirs,
	calculatePackageDependencies,
	createBuildOrder,
} from "./shared.js";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const hasBunOnPath = (() => {
    try {
        execSync("bun --version", { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
})();

/**
 * Builds the packages in the correct order.
 * @param {Array<string>} packageDirs An array of directories to build in order.
 * @returns {void}
 */
function buildPackages(packageDirs) {
	console.log(`Building packages in this order: ${packageDirs.join(", ")}`);

	for (const packageDir of packageDirs) {
		console.log(`Building ${packageDir}...`);
		try {
			const pkg = JSON.parse(
				readFileSync(path.join(packageDir, "package.json"), "utf8"),
			);

			if (pkg.scripts && pkg.scripts.build) {
				const useBunRuntime = Boolean(process.versions && process.versions.bun) || hasBunOnPath;
				const cmd = useBunRuntime ? "bun run build" : "npm run build";
				execSync(cmd, {
					stdio: "inherit",
					cwd: packageDir,
				});
			} else {
				console.log(`Skipping ${packageDir} (no build script).`);
			}
		} catch (error) {
			console.warn(
				`Skipping ${packageDir} (unable to read or parse package.json):`,
				error && (error.message || String(error)),
			);
		}
	}

	console.log("Done building packages.");
}

//------------------------------------------------------------------------------
// Main Script
//------------------------------------------------------------------------------

const packageDirs = await getPackageDirs();
const dependencies = await calculatePackageDependencies(packageDirs);
const buildOrder = createBuildOrder(dependencies);

buildPackages(buildOrder);
