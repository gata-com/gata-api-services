import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { FinalProjectCreateRequest } from "@/types/mahasiswa";
import { TugasAkhirService } from "@/services/mahasiswa/tugasAkhirService";

export const create = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const finalProjectService = new TugasAkhirService();

    // Parse body data
    const bodyData: FinalProjectCreateRequest = req.body;

    // Handle uploaded files from multer
    const files = req.files as Express.Multer.File[];

    // Map files ke members berdasarkan field name (draft_path_0, dispen_path_0, dll)
    if (bodyData.members && files && files.length > 0) {
      //   parsing members ke array
      let parsedMembers: any[] = [];
      if (bodyData.members && typeof bodyData.members === "string") {
        parsedMembers = JSON.parse(bodyData.members);
      } else {
        throw new Error("Members data is missing or invalid");
      }

      bodyData.members = parsedMembers.map((member, index) => {
        // Cari file berdasarkan fieldname
        const draftFile = files.find(
          (f) => f.fieldname === `draft_path_${index}`
        );
        const dispenFile = files.find(
          (f) => f.fieldname === `dispen_path_${index}`
        );

        return {
          ...member,
          draft_path: draftFile || null,
          dispen_path: dispenFile || null,
        };
      });
    }

    const result = await finalProjectService.createFinalProject(bodyData);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(201).json({
      message: "Tugas akhir berhasil dibuat",
      data: result.data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        field: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
