import { Request, Response } from "express";
import {
  AnnouncementService,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "@/services/admin/announcementService";
import { ApiResponse, AuthRequest } from "@/types";

const announcementService = new AnnouncementService();

/**
 * Get all announcements with pagination and filtering
 * GET /admin/pengumuman
 */
export const getAllAnnouncements = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { page, limit, is_published, priority, search } = req.query;

    const result = await announcementService.getAllAnnouncements({
      page,
      limit,
      is_published: is_published ? is_published === "true" : undefined,
      priority,
      search,
    });

    return res.status(200).json({
      message: "Pengumuman berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting announcements:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pengumuman",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get announcement by ID
 * GET /admin/pengumuman/:id
 */
export const getAnnouncementById = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.getAnnouncementById(
      parseInt(id)
    );

    return res.status(200).json({
      message: "Pengumuman berhasil diambil",
      data: announcement,
    });
  } catch (error) {
    console.error("Error getting announcement:", error);

    if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan",
        errors: { path: "id", msg: "Announcement not found" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil pengumuman",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Create new announcement
 * POST /admin/pengumuman
 */
export const createAnnouncement = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { title, content, priority, is_published } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        errors: { path: "auth", msg: "User not authenticated" },
      });
    }

    if (!title || !content || !priority) {
      return res.status(400).json({
        message: "Field title, content, dan priority harus diisi",
        errors: {
          path: "body",
          msg: "Missing required fields",
        },
      });
    }

    const createData: CreateAnnouncementRequest = {
      title,
      content,
      priority,
      is_published: is_published ?? false,
      userId,
    };

    const newAnnouncement = await announcementService.createAnnouncement(
      createData
    );

    return res.status(201).json({
      message: "Pengumuman berhasil dibuat",
      data: newAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat membuat pengumuman",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Update announcement
 * PUT /admin/pengumuman/:id
 */
export const updateAnnouncement = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { title, content, priority, is_published } = req.body;

    const updateData: UpdateAnnouncementRequest = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (is_published !== undefined) updateData.is_published = is_published;

    // Check if any data is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Tidak ada data yang akan diupdate",
        errors: { path: "body", msg: "No data provided" },
      });
    }

    const updatedAnnouncement = await announcementService.updateAnnouncement(
      parseInt(id),
      updateData
    );

    return res.status(200).json({
      message: "Pengumuman berhasil diupdate",
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);

    if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan",
        errors: { path: "id", msg: "Announcement not found" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengupdate pengumuman",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Delete announcement
 * DELETE /admin/pengumuman/:id
 */
export const deleteAnnouncement = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;

    await announcementService.deleteAnnouncement(parseInt(id));

    return res.status(200).json({
      message: "Pengumuman berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);

    if (error instanceof Error && error.message === "ANNOUNCEMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan",
        errors: { path: "id", msg: "Announcement not found" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat menghapus pengumuman",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
