import { AnnouncementRepository } from "@/repositories/AnnouncementRepository";
import Announcements from "@/entities/announcement";
import { PaginationResult, PaginationQuery } from "@/types";

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority: "low" | "high";
  is_published?: boolean;
  userId: number;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  priority?: "low" | "high";
  is_published?: boolean;
}

export interface AnnouncementQueryParams extends PaginationQuery {
  is_published?: boolean;
  priority?: string;
}

export class AnnouncementService {
  private announcementRepository: AnnouncementRepository;

  constructor() {
    this.announcementRepository = new AnnouncementRepository();
  }

  /**
   * Get all announcements with pagination and filtering
   */
  async getAllAnnouncements(
    query: any
  ): Promise<PaginationResult<Announcements>> {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);

    const result = await this.announcementRepository.findAllWithPagination({
      is_published: query.is_published,
      priority: query.priority,
      search: query.search,
      page: page.toString(),
      limit: limit.toString(),
      sortBy: query.sortBy || "created_at",
      sortOrder: query.sortOrder || "DESC",
    });

    return result;
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id: number): Promise<Announcements> {
    const announcement = await this.announcementRepository.findById(id);

    if (!announcement) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }

    return announcement;
  }

  /**
   * Create new announcement
   */
  async createAnnouncement(
    data: CreateAnnouncementRequest
  ): Promise<Announcements> {
    const announcement = await this.announcementRepository.create({
      title: data.title,
      content: data.content,
      priority: data.priority,
      is_published: data.is_published || false,
      user: { id: data.userId } as any,
    });

    return announcement;
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(
    id: number,
    data: UpdateAnnouncementRequest
  ): Promise<Announcements> {
    const announcement = await this.announcementRepository.findById(id);

    if (!announcement) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }

    const updateData: Partial<Announcements> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.is_published !== undefined)
      updateData.is_published = data.is_published;

    const updated = await this.announcementRepository.update(id, updateData);

    return updated;
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: number): Promise<void> {
    await this.announcementRepository.delete(id);
  }

  /**
   * Get published announcements
   */
  async getPublishedAnnouncements(): Promise<Announcements[]> {
    return await this.announcementRepository.findPublished();
  }
}
