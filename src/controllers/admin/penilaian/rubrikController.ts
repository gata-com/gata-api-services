import { Request, Response } from "express";
import { RubrikService } from "@/services/admin/rubrikService";
import { ApiResponse } from "@/types";

const rubrikService = new RubrikService();

// ========== RUBRIK MANAGEMENT ==========

export const getAllRubriks = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { type } = req.query;
    const rubriks = await rubrikService.getAllRubriks(
      type as "SID" | "SEM" | undefined
    );

    return res.status(200).json({
      message: "Rubriks retrieved successfully",
      data: rubriks,
    });
  } catch (error) {
    console.error("Error getting rubriks:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil rubrik",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const getRubrikById = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const rubrik = await rubrikService.getRubrikById(id);

    if (!rubrik) {
      return res.status(404).json({
        message: "Rubrik tidak ditemukan",
        errors: { path: "id", msg: "Rubrik not found" },
      });
    }

    return res.status(200).json({
      message: "Rubrik retrieved successfully",
      data: rubrik,
    });
  } catch (error) {
    console.error("Error getting rubrik:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const createRubrik = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { nama, deskripsi, type } = req.body;

    const rubrik = await rubrikService.createRubrik({
      nama,
      deskripsi,
      type,
    });

    return res.status(201).json({
      message: "Rubrik berhasil dibuat",
      data: rubrik,
    });
  } catch (error) {
    console.error("Error creating rubrik:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const updateRubrik = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const rubrik = await rubrikService.updateRubrik(id, req.body);

    if (!rubrik) {
      return res.status(404).json({
        message: "Rubrik tidak ditemukan",
        errors: { path: "id", msg: "Rubrik not found" },
      });
    }

    return res.status(200).json({
      message: "Rubrik berhasil diupdate",
      data: rubrik,
    });
  } catch (error) {
    console.error("Error updating rubrik:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const deleteRubrik = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    await rubrikService.deleteRubrik(id);

    return res.status(200).json({
      message: "Rubrik berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting rubrik:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const duplicateRubrik = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { nama } = req.body;

    const rubrik = await rubrikService.duplicateRubrik(id, nama);

    return res.status(201).json({
      message: "Rubrik berhasil diduplikasi",
      data: rubrik,
    });
  } catch (error) {
    console.error("Error duplicating rubrik:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const setDefaultRubrik = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    await rubrikService.setDefaultRubrik(id, type);

    return res.status(200).json({
      message: "Rubrik default berhasil diset",
    });
  } catch (error) {
    console.error("Error setting default rubrik:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

// ========== GROUP MANAGEMENT ==========

export const createGroup = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { rubrikId } = req.params;
    const { nama, bobotTotal, urutan } = req.body;

    const group = await rubrikService.createGroup({
      rubrikId,
      nama,
      bobotTotal,
      urutan,
    });

    return res.status(201).json({
      message: "Group berhasil dibuat",
      data: group,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const updateGroup = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const group = await rubrikService.updateGroup(id, req.body);

    if (!group) {
      return res.status(404).json({
        message: "Group tidak ditemukan",
        errors: { path: "id", msg: "Group not found" },
      });
    }

    return res.status(200).json({
      message: "Group berhasil diupdate",
      data: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const setDefaultGroup = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const group = await rubrikService.setDefaultGroup(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group tidak ditemukan",
        errors: { path: "groupId", msg: "Group not found" },
      });
    }

    return res.status(200).json({
      message: "Group berhasil diset sebagai default",
      data: group,
    });
  } catch (error) {
    console.error("Error setting default group:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const unsetDefaultGroup = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const group = await rubrikService.unsetDefaultGroup(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group tidak ditemukan",
        errors: { path: "groupId", msg: "Group not found" },
      });
    }

    return res.status(200).json({
      message: "Group default berhasil dihapus",
      data: group,
    });
  } catch (error) {
    console.error("Error unsetting default group:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const deleteGroup = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    await rubrikService.deleteGroup(id);

    return res.status(200).json({
      message: "Group berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const reorderGroups = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { rubrikId } = req.params;
    const { items } = req.body;

    await rubrikService.reorderGroups(rubrikId, items);

    return res.status(200).json({
      message: "Groups berhasil direorder",
    });
  } catch (error) {
    console.error("Error reordering groups:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

// ========== PERTANYAAN MANAGEMENT ==========

export const createPertanyaan = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const { text, bobot, urutan } = req.body;

    const pertanyaan = await rubrikService.createPertanyaan({
      groupId,
      text,
      bobot,
      urutan,
    });

    return res.status(201).json({
      message: "Pertanyaan berhasil dibuat",
      data: pertanyaan,
    });
  } catch (error) {
    console.error("Error creating pertanyaan:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const updatePertanyaan = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const pertanyaan = await rubrikService.updatePertanyaan(id, req.body);

    if (!pertanyaan) {
      return res.status(404).json({
        message: "Pertanyaan tidak ditemukan",
        errors: { path: "pertanyaanId", msg: "Pertanyaan not found" },
      });
    }

    return res.status(200).json({
      message: "Pertanyaan berhasil diupdate",
      data: pertanyaan,
    });
  } catch (error) {
    console.error("Error updating pertanyaan:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const deletePertanyaan = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    await rubrikService.deletePertanyaan(id);

    return res.status(200).json({
      message: "Pertanyaan berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting pertanyaan:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const duplicatePertanyaan = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const pertanyaan = await rubrikService.duplicatePertanyaan(id);

    return res.status(201).json({
      message: "Pertanyaan berhasil diduplikasi",
      data: pertanyaan,
    });
  } catch (error) {
    console.error("Error duplicating pertanyaan:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const reorderPertanyaans = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const { items } = req.body;

    await rubrikService.reorderPertanyaans(groupId, items);

    return res.status(200).json({
      message: "Pertanyaans berhasil direorder",
    });
  } catch (error) {
    console.error("Error reordering pertanyaans:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

// ========== OPSI JAWABAN MANAGEMENT ==========

export const createOpsiJawaban = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { pertanyaanId } = req.params;
    const { text, nilai, urutan } = req.body;

    const opsi = await rubrikService.createOpsiJawaban({
      pertanyaanId,
      text,
      nilai,
      urutan,
    });

    return res.status(201).json({
      message: "Opsi jawaban berhasil dibuat",
      data: opsi,
    });
  } catch (error) {
    console.error("Error creating opsi jawaban:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const updateOpsiJawaban = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const opsi = await rubrikService.updateOpsiJawaban(id, req.body);

    if (!opsi) {
      return res.status(404).json({
        message: "Opsi jawaban tidak ditemukan",
        errors: { path: "id", msg: "Opsi jawaban not found" },
      });
    }

    return res.status(200).json({
      message: "Opsi jawaban berhasil diupdate",
      data: opsi,
    });
  } catch (error) {
    console.error("Error updating opsi jawaban:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const deleteOpsiJawaban = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    await rubrikService.deleteOpsiJawaban(id);

    return res.status(200).json({
      message: "Opsi jawaban berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting opsi jawaban:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

export const bulkDeleteOpsiJawaban = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { opsiIds } = req.body;

    await rubrikService.bulkDeleteOpsiJawaban(opsiIds);

    return res.status(200).json({
      message: "Opsi jawaban berhasil dihapus",
    });
  } catch (error) {
    console.error("Error bulk deleting opsi jawaban:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
