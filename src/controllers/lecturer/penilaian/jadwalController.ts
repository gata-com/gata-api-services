import { Request, Response } from "express";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { ApiResponse } from "@/types";

const scheduleRepo = new DefenseScheduleRepository();

/**
 * Get jadwal sidang untuk dosen
 * GET /dosen/penilaian/jadwal
 */
export const getJadwalSidang = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    // @ts-ignore - user added by auth middleware
    const lecturerId = req.user?.lecturer?.id;

    // if (!lecturerId) {
    //   return res.status(403).json({
    //     message: "Forbidden",
    //     errors: { path: "user", msg: "Lecturer ID not found" },
    //   });
    // }

    // Get jadwal where lecturer is pembimbing or penguji
    const jadwals = await scheduleRepo.findAll();

    // Filter jadwal untuk dosen ini
    // const filteredJadwals = jadwals.filter((jadwal) => {
    //   const submission = jadwal.defense_submission;
    //   const finalProject = submission.final_project;

    //   const isPembimbing =
    //     finalProject.supervisor_1?.id === lecturerId ||
    //     finalProject.supervisor_2?.id === lecturerId;

    //   const isPenguji =
    //     submission.examiner_1?.id === lecturerId ||
    //     submission.examiner_2?.id === lecturerId;

    //   return isPembimbing || isPenguji;
    // });

    return res.status(200).json({
      message: "Jadwal sidang retrieved successfully",
      data: jadwals,
    });
  } catch (error) {
    console.error("Error getting jadwal sidang:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get detail jadwal sidang
 * GET /dosen/penilaian/jadwal/:jadwalId
 */
export const getJadwalDetail = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    // @ts-ignore - user added by auth middleware
    const lecturerId = req.user?.lecturer?.id;

    if (!lecturerId) {
      return res.status(403).json({
        message: "Forbidden",
        errors: { path: "user", msg: "Lecturer ID not found" },
      });
    }

    const jadwal = await scheduleRepo.findByDefenseSubmissionId(jadwalId);

    if (!jadwal) {
      return res.status(404).json({
        message: "Jadwal tidak ditemukan",
        errors: { path: "jadwalId", msg: "Jadwal not found" },
      });
    }

    // Verify lecturer has access to this jadwal
    const submission = jadwal.defense_submission;
    const finalProject = submission.final_project;

    const hasAccess =
      finalProject.supervisor_1?.id === lecturerId ||
      finalProject.supervisor_2?.id === lecturerId ||
      submission.examiner_1?.id === lecturerId ||
      submission.examiner_2?.id === lecturerId;

    if (!hasAccess) {
      return res.status(403).json({
        message: "Forbidden",
        errors: { path: "access", msg: "You don't have access to this jadwal" },
      });
    }

    return res.status(200).json({
      message: "Jadwal detail retrieved successfully",
      data: jadwal,
    });
  } catch (error) {
    console.error("Error getting jadwal detail:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
