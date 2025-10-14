import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const migrationsDir = path.resolve(__dirname, "../migrations");

try {
  console.log("Starting migration fresh process...");

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
  execSync(
    // set NODE_ENV=production to disable synchronize in data-source.ts
    "set NODE_ENV=production && npx typeorm-ts-node-commonjs schema:drop -d ./src/config/data-source.ts",
    {
      stdio: "inherit",
    }
  );
  console.log("Database schema dropped successfully.");

  // 3. Generate migration baru
  console.log("Generating new migration...");
  execSync(
    "set NODE_ENV=production && npx typeorm-ts-node-commonjs migration:generate -d ./src/config/data-source.ts ./src/migrations/MigrationDB",
    { stdio: "inherit" }
  );
  console.log("New migration generated successfully.");

  // 4. Run migrations explicitly (before seeding)
  console.log("Running migrations...");
  execSync(
    "set NODE_ENV=production && npx typeorm-ts-node-commonjs migration:run -d ./src/config/data-source.ts",
    { stdio: "inherit" }
  );
  console.log("Migrations executed successfully.");

  console.log("Migration fresh process completed.");

  // 5. jalanakan seeder
  // console.log("Running seeders...");
  // execSync("set NODE_ENV=production && ts-node src/seeds/RunSeeder.ts", {
  //   stdio: "inherit",
  // });
  // console.log("Seeders executed successfully.");
} catch (error) {
  console.error("An error occurred during the migration fresh process:", error);
  process.exit(1);
}
