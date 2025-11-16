import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const migrationsDir = path.resolve(__dirname, "../migrations");

// Detect OS and set NODE_ENV accordingly
const isWindows = os.platform() === "win32";
const nodeEnvCmd = isWindows
  ? "set NODE_ENV=production && "
  : "NODE_ENV=production ";

try {
  console.log("Starting migration fresh process...");
  console.log(`Platform: ${os.platform()}`);

  // 1. Hapus semua file migration lama
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(migrationsDir, file));
    }
    console.log("Old migration files deleted.");
  }

  // 2. Drop schema
  console.log("Dropping database schema...");
  try {
    execSync(
      `${nodeEnvCmd}npx typeorm-ts-node-commonjs schema:drop -d ./src/config/data-source.ts`,
      {
        stdio: "inherit",
        shell: isWindows ? undefined : "/bin/bash",
      }
    );
    console.log("Database schema dropped successfully.");
  } catch (error: any) {
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("connect")
    ) {
      console.warn("⚠️ Warning: Could not connect to database for schema drop");
      console.warn("   Make sure MySQL is running and credentials are correct");
    } else {
      throw error;
    }
  }

  // 3. Generate migration baru
  console.log("Generating new migration...");
  execSync(
    `${nodeEnvCmd}npx typeorm-ts-node-commonjs migration:generate -d ./src/config/data-source.ts ./src/migrations/MigrationDB`,
    {
      stdio: "inherit",
      shell: isWindows ? undefined : "/bin/bash",
    }
  );
  console.log("New migration generated successfully.");

  // 4. Run migrations explicitly (before seeding)
  console.log("Running migrations...");
  execSync(
    `${nodeEnvCmd}npx typeorm-ts-node-commonjs migration:run -d ./src/config/data-source.ts`,
    {
      stdio: "inherit",
      shell: isWindows ? undefined : "/bin/bash",
    }
  );
  console.log("Migrations executed successfully.");

  console.log("✅ Migration fresh process completed.");

} catch (error) {
  console.error(
    "❌ An error occurred during the migration fresh process:",
    error
  );
  process.exit(1);
}
