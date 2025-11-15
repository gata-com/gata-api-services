import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { TugasAkhirService } from "@/services/student/tugasAkhirServices";

export const getStudentByQuery = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    //  ambil query parameter dari request
    const query = req.query.query as string;

    // validasi query parameter
    if (!query) {
      return res.status(400).json({
        message: "Query parameter is required",
        errors: {
          path: "query",
          msg: "Query parameter cannot be empty",
        },
      });
    }

    const tugasAkhirService = new TugasAkhirService();
    const result = await tugasAkhirService.getDataByQuery({ query });

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }
    return res.status(200).json({
      message: "Data mahasiswa ditemukan",
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
