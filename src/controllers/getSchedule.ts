import { Request, Response } from "express";
import { DefenseScheduleImportService } from "@/services/admin/defenseScheduleService";
import { ApiResponse } from "@/types";

interface ScheduleResponse {
  nim: string;
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  spv_1: string;
  spv_2: string;
  examiner_1: string;
  examiner_2: string;
  status: string;
  location: string;
}

export const getSchedule = async (
  req: Request,
  res: Response<ApiResponse<ScheduleResponse[]>>
): Promise<any> => {
  const defenseScheduleService = new DefenseScheduleImportService();
  try {
    const schedules = await defenseScheduleService.getAllSchedules();
    return res.status(200).json({
      message: "Schedules retrieved successfully",
      data: schedules,
    });
  } catch (error) {
    console.error("Error getting schedules:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
