import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// TypeORM DataSource configuration
const AppDataSource = new DataSource({
  type: "mysql", // ganti sesuai database kamu
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gataDB",
  synchronize: !isProduction,
  logging: process.env.DB_LOGGING === "true",
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migrations/**/*.{ts,js}"],
  subscribers: ["src/subscribers/**/*.{ts,js}"],
});

export default AppDataSource;
