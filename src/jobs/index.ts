import cron from "node-cron";
import { finalProjectAutoRejectJob } from "./schedulers/finalProjectAutoReject";

export const initializeCronJobs = () => {
  // Jalanan job setiap hari pada pukul 00:00
  cron.schedule(
    "0 0 * * *",
    async () => {
      await finalProjectAutoRejectJob();
    },
    {
      timezone: "Asia/Jakarta",
    }
  );
};
