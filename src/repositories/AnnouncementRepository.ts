import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import Announcements from "../entities/announcement";
import { PaginationResult, PaginationQuery } from "../types";

export class AnnouncementRepository {
  public repository: Repository<Announcements>;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(Announcements);
    } else {
      this.repository = AppDataSource.getRepository(Announcements);
    }
  }

  /**
   * Get all announcements with pagination and filtering
   */
  async findAllWithPagination(
    query: PaginationQuery & {
      is_published?: boolean;
      priority?: string;
    }
  ): Promise<PaginationResult<Announcements>> {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const sortBy = query.sortBy || "created_at";
    const sortOrder = query.sortOrder || "DESC";

    let queryBuilder = this.repository
      .createQueryBuilder("announcement")
      .leftJoinAndSelect("announcement.user", "user");

    if (query.search) {
      queryBuilder = queryBuilder.where(
        "(announcement.title ILIKE :search OR announcement.content ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    if (query.is_published !== undefined) {
      queryBuilder = queryBuilder.andWhere(
        "announcement.is_published = :published",
        {
          published: query.is_published,
        }
      );
    }

    if (query.priority) {
      queryBuilder = queryBuilder.andWhere(
        "announcement.priority = :priority",
        {
          priority: query.priority,
        }
      );
    }

    queryBuilder = queryBuilder
      .orderBy(`announcement.${sortBy}`, sortOrder as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get announcement by ID
   */
  async findById(id: number): Promise<Announcements | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["user"],
    });
  }

  /**
   * Create new announcement
   */
  async create(data: Partial<Announcements>): Promise<Announcements> {
    const announcement = this.repository.create(data);
    return await this.repository.save(announcement);
  }

  /**
   * Update announcement
   */
  async update(
    id: number,
    data: Partial<Announcements>
  ): Promise<Announcements> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }
    return updated;
  }

  /**
   * Delete announcement
   */
  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }
  }

  /**
   * Get published announcements
   */
  async findPublished(): Promise<Announcements[]> {
    return await this.repository.find({
      where: { is_published: true },
      order: { priority: "DESC" },
      relations: ["user"],
    });
  }
}
