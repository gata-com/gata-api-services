import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "./config";
import * as path from "path";
import * as fs from "fs";

// Import all entities explicitly
import User from "../entities/user";
import { Lecturer } from "../entities/lecturer";
import { Student } from "../entities/student";
import ExpertisesGroup from "../entities/expertisesGroup";
import { LecturerExpertise } from "../entities/lecturerExpertise";
import {
  FinalProjectPeriods,
  FinalProjects,
  FinalProjectMembers,
} from "../entities/finalProject";
import {
  DefenseSubmission,
  DefenseSubmissionDocument,
} from "../entities/defenses";
import { DefenseSchedule } from "../entities/defenseSchedule";
import {
  GuidanceAvailability,
  GuidanceSession,
  GuidanceDraftLink,
} from "../entities/guidance";
import Notifications from "../entities/notification";
import Announcements from "../entities/announcement";
// Import penilaian entities
import { Rubrik } from "../entities/rubrik";
import { RubrikGroup } from "../entities/rubrikGroup";
import { Pertanyaan } from "../entities/pertanyaan";
import { OpsiJawaban } from "../entities/opsiJawaban";
import { RentangNilai } from "../entities/rentangNilai";
import { Penilaian } from "../entities/penilaian";
import { JawabanPenilaian } from "../entities/jawabanPenilaian";
import { BeritaAcaraPenilaian } from "../entities/beritaAcaraPenilaian";
import { BeritaAcaraPDF } from "@/entities/beritaAcaraPDF";
import { TempExportCsv } from "@/entities/tempExportCsv";
import { Signature } from "@/entities/signature";

// Create data source configuration based on database type
const createDataSourceConfig = (): DataSourceOptions => {
  const baseConfig = {
    synchronize: false,
    logging: config.database.logging,
    entities: [
      User,
      Lecturer,
      Student,
      ExpertisesGroup,
      LecturerExpertise,
      FinalProjectPeriods,
      FinalProjects,
      FinalProjectMembers,
      DefenseSubmission,
      DefenseSubmissionDocument,
      DefenseSchedule,
      GuidanceAvailability,
      GuidanceSession,
      GuidanceDraftLink,
      Notifications,
      Announcements,
      Rubrik,
      RubrikGroup,
      Pertanyaan,
      OpsiJawaban,
      RentangNilai,
      Penilaian,
      JawabanPenilaian,
      BeritaAcaraPenilaian,
      BeritaAcaraPDF,
      TempExportCsv,
      Signature,
    ],
    migrations: [__dirname + "/../migrations/*.{ts,js}"],
    subscribers: [__dirname + "/../subscribers/*.{ts,js}"],
    migrationsRun: false,
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
    // Enable connection pooling
    // cache: {
    //   duration: 30000, // 30 seconds
    // },
  };
  return mysqlConfig;
};

const AppDataSource = new DataSource(createDataSourceConfig());

// PENTING: Hapus export const dan hanya gunakan export default
// export const AppDataSource = new DataSource(createDataSourceConfig()); // HAPUS INI

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      // Run pending migrations if any
      try {
        const pendingMigrations = await AppDataSource.showMigrations();
        if (pendingMigrations) {
          await AppDataSource.runMigrations();
        }
      } catch (migrationError) {
        console.warn(
          "⚠️ Migration check failed (this is normal for new databases):",
          migrationError
        );
      }
    } else {
      console.log("⚠️ Database already initialized");
    }
  } catch (error) {
    console.error("❌ Database connection error:", error);
    if (error instanceof Error) {
      console.error("🔍 Error type:", error.constructor.name);
      console.error("🔍 Error message:", error.message);

      // MySQL specific error handling
      if (error.message.includes("ECONNREFUSED")) {
        console.error("💡 Suggestion: Make sure MySQL server is running");
      } else if (error.message.includes("ER_ACCESS_DENIED_ERROR")) {
        console.error("💡 Suggestion: Check username and password");
      } else if (error.message.includes("ER_BAD_DB_ERROR")) {
        console.error(
          '💡 Suggestion: Database "gataDB" might not exist. Create it first:'
        );
        console.error(
          "CREATE DATABASE gataDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        );
      }
    }
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("✅ Database connection closed");
    }
  } catch (error) {
    console.error("❌ Error closing database:", error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return AppDataSource;
};

// Helper function to backup database (MySQL dump)
export const backupDatabase = async (backupPath?: string): Promise<string> => {
  // For MySQL, you would typically use mysqldump
  const backup = backupPath || `./backups/gataDB_backup_${Date.now()}.sql`;
  const backupDir = path.dirname(backup);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return backup;
};

// HANYA SATU EXPORT DEFAULT - INI YANG DIBACA TYPEORM CLI
export default AppDataSource;
