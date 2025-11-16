#!/usr/bin/env node
/**
 * Start script for production environment
 * This script registers tsconfig-paths and then loads the server
 */

const path = require("path");
const fs = require("fs");
const tsConfigPaths = require("tsconfig-paths");

console.log("🚀 Starting GATA API Services...");
console.log("📂 Working directory:", __dirname);

// Ensure we're using the dist folder
const appDir = __dirname;
const distDir = path.join(appDir, "dist");

console.log("📁 Checking dist directory:", distDir);

// Check if dist folder exists
if (!fs.existsSync(distDir)) {
  console.error(
    "❌ Error: dist folder not found. Please run 'npm run build' first."
  );
  process.exit(1);
}

const serverPath = path.join(distDir, "server.js");
if (!fs.existsSync(serverPath)) {
  console.error(
    "❌ Error: server.js not found in dist folder. Build may have failed."
  );
  process.exit(1);
}

console.log("✅ Build files found");

// Register path alias resolution BEFORE loading any modules
try {
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
  if (fs.existsSync(tsConfigPath)) {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, "utf-8"));
      if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
        pathMappings = tsConfig.compilerOptions.paths;
      }
      console.log("✅ Loaded path mappings from tsconfig.json");
    } catch (err) {
      console.warn(
        "⚠️  Warning: Could not parse tsconfig.json, using default paths"
      );
    }
  }

  // Register the paths pointing to dist directory
  tsConfigPaths.register({
    baseUrl: distDir,
    paths: pathMappings,
  });

  console.log("✅ Path aliases registered");
} catch (err) {
  console.error("❌ Error registering path aliases:", err.message);
  console.error("⚠️  Exiting - path aliases are required for this application");
  process.exit(1);
}

// Load and run the server
console.log("🔄 Loading server...");
try {
  require(serverPath);
  console.log("✅ Server loaded successfully");
} catch (err) {
  console.error("❌ Error starting server:", err);
  process.exit(1);
}
