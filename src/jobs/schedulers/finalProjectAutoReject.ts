import { FinalProjectPeriodsRepository } from "@/repositories/FinalProjectPeriodsRepository";

export const finalProjectAutoRejectJob = async () => {
  try {
    const fppRepo = new FinalProjectPeriodsRepository();
    const affectedCount = await fppRepo.processRejectionOnPeriodEnd();
    console.log(
      `✅ Final Project Auto Reject Job completed. Total proposals rejected: ${
        affectedCount ? affectedCount : 0
      }`
    );
  } catch (error) {
    console.error("❌ Error in Final Project Auto Reject Job:", error);
  }
};
