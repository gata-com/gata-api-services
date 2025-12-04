import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "./config";

// Import all entities explicitly for seed compatibility
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
import { BeritaAcaraPDF } from "../entities/beritaAcaraPDF";
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
