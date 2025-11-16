import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "./config";

// Create data source configuration based on database type
const createDataSourceConfig = (): DataSourceOptions => {
  const baseConfig = {
    synchronize: false,
    logging: config.database.logging,
    entities: [__dirname + "/../entities/*.{ts,js}"],
    migrations: [__dirname + "/../migrations/*.{ts,js}"],
    subscribers: [__dirname + "/../subscribers/*.{ts,js}"],
    migrationsRun: true,
  };

  const mysqlConfig: DataSourceOptions = {
    type: "mysql",
    host: config.database.host,
    port: config.database.port ? Number(config.database.port) : undefined,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    ...baseConfig,
    // MySQL specific options - OPTIMIZED
    extra: {
      connectionLimit: 20,
      queueLimit: 0,
      // Connection flags untuk MySQL
      ssl: false,
      // Improve performance
      dateStrings: false,
      typeCast: true,
      // Timeout settings
      connectTimeout: 60000,
    },
  };
  return mysqlConfig;
};

const AppDataSource = new DataSource(createDataSourceConfig());

export default AppDataSource;
