import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const migrationsDir = path.resolve(__dirname, "../migrations");

// 1. Hapus semua file migration lama
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir);
  for (const file of files) {
    fs.unlinkSync(path.join(migrationsDir, file));
  }
}

// 2. Drop schema
execSync(
  "npx typeorm-ts-node-commonjs schema:drop -d ./src/config/data-source.ts",
  {
    stdio: "inherit",
  }
);

// 3. Generate migration baru
execSync(
  "npx typeorm-ts-node-commonjs migration:generate -d ./src/config/data-source.ts ./src/migrations/MigrationDB",
  { stdio: "inherit" }
);

// 4. Run migration
execSync(
  "npx typeorm-ts-node-commonjs migration:run -d ./src/config/data-source.ts",
  {
    stdio: "inherit",
  }
);
