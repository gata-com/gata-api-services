#!/usr/bin/env node
/**
 * Start script for production environment
 * This script registers tsconfig-paths and then loads the server
 */

const path = require("path");
const fs = require("fs");

// Ensure we're using the dist folder
const appDir = __dirname;
const distDir = path.join(appDir, "dist");

// Check if dist folder exists
if (!fs.existsSync(distDir)) {
  console.error(
    "Error: dist folder not found. Please run 'npm run build' first."
  );
  process.exit(1);
}

// Register path alias resolution using tsconfig-paths
const tsConfigPaths = require("tsconfig-paths");

// Load tsconfig.json
const tsConfigPath = path.join(appDir, "tsconfig.json");
let pathMappings = {
  "@/*": ["./*"],
  "@/types/*": ["./types/*"],
  "@/controllers/*": ["./controllers/*"],
  "@/middleware/*": ["./middleware/*"],
  "@/entities/*": ["./entities/*"],
  "@/repositories/*": ["./repositories/*"],
  "@/services/*": ["./services/*"],
  "@/routes/*": ["./routes/*"],
  "@/config/*": ["./config/*"],
  "@/utils/*": ["./utils/*"],
};

// Try to load from tsconfig.json
try {
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, "utf-8"));
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      pathMappings = tsConfig.compilerOptions.paths;
    }
  }
} catch (err) {
  console.warn("Warning: Could not parse tsconfig.json, using default paths");
}

// Register the paths pointing to dist directory
tsConfigPaths.register({
  baseUrl: distDir,
  paths: pathMappings,
});

// Load and run the server
require(path.join(distDir, "server.js"));
