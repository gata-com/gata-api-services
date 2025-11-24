import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import User from "../entities/user";
import { Student } from "../entities/student";
import { Lecturer } from "../entities/lecturer";
import {
  CreateUserData,
  UpdateUserData,
  UserQueryParams,
  UserRole,
  ExpertisesGroup,
} from "../types/user";
import { PaginationResult, PaginationQuery } from "../types";

export class UserRepository {
  public repository: Repository<User>;
  public qr: any;
  private studentRepository: Repository<Student>;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(User);
      this.studentRepository = queryRunner.manager.getRepository(Student);
    } else {
      this.repository = AppDataSource.getRepository(User);
      this.studentRepository = AppDataSource.getRepository(Student);
    }

    this.qr = AppDataSource.createQueryRunner();
  }

  /**
   * Create new user
   * @param userData
   * @returns
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async createUserWithStudent(
    userData: Partial<User>,
    studentData: Partial<Student>
  ): Promise<any> {
    const id = await AppDataSource.manager.transaction(async (manager) => {
      // Create dan save user terlebih dahulu
      const user = manager.create(User, userData);
      const savedUser = await manager.save(user);

      if (savedUser) {
        // Create student dengan userId yang otomatis terisi
        const student = manager.create(Student, {
          ...studentData,
          user: savedUser, // Foreign key otomatis terisi
        });
        await manager.save(student);
      }

      // Return user dengan data student
      return savedUser.id;
    });

    return await this.findById(id);
  }

  async createUserWithLecturer(
    userData: Partial<User>,
    lecturerData: Partial<Lecturer>
  ): Promise<any> {
    const id = await AppDataSource.manager.transaction(async (manager) => {
      // Create dan save user terlebih dahulu
      const user = manager.create(User, userData);
      const savedUser = await manager.save(user);

      if (savedUser) {
        // Create lecturer dengan userId yang otomatis terisi
        const lecturerRepository = manager.getRepository(Lecturer);
        const lecturer = lecturerRepository.create({
          ...lecturerData,
          user: savedUser, // Foreign key otomatis terisi
        });
        await manager.save(lecturer);
      }

      // Return user dengan data lecturer
      return savedUser.id;
    });

    return await this.findById(id);
  }

  /**
   * Find user
   * @returns
   */
  async findAllActive(): Promise<User[]> {
    return await this.repository.find({ where: { is_active: true } });
  }

  // Search user by email
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["student", "lecturer.expertises"],
    });
  }
  // find by query email (like %email%) if role is student
  async findByQueryEmail(query: string): Promise<Partial<User>[]> {
    const users = await this.repository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.student", "student")
      .where("user.email LIKE :query", { query: `%${query}%` })
      .andWhere("user.role = :role", { role: "student" })
      .select(["user.id", "user.name", "user.email", "student.id"])
      .getMany();

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.student.id,
    }));
  }

  async findUserWithStudentById(id: number): Promise<Partial<User> | null> {
    return await this.studentRepository
      .createQueryBuilder("student")
      .innerJoinAndSelect("student.user", "user")
      .where("user.id = :id", { id })
      .select(["student.id"])
      .getOne();
  }

  // find all lecturers
  async findAllWithLecturer(): Promise<User[]> {
    return await this.repository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.lecturer", "lecturer")
      .where("user.role = :role", { role: "lecturer" })
      .andWhere(
        "lecturer.current_supervised_1 < lecturer.max_supervised_1 OR lecturer.current_supervised_2 < lecturer.max_supervised_2"
      )
      .select([
        "user.id",
        "user.name",
        "user.email",
        "lecturer.id",
        "lecturer.current_supervised_1",
        "lecturer.current_supervised_2",
        "lecturer.max_supervised_1",
        "lecturer.max_supervised_2",
      ])
      .getMany();
  }
  // Search user by id
  async findByIdWithStudent(id: number): Promise<User | null> {
    return await this.repository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.student", "student")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      select: [
        "id",
        "role",
        "name",
        "email",
        "password",
        "whatsapp_number",
        "is_active",
        "last_login",
        "created_at",
      ],
    });
  }

  async findByNimWithStudent(nim: string): Promise<Student | null> {
    return await this.studentRepository.findOne({
      where: { nim },
    });
  }

  async findByIdWithStudentAndFPMAndFPAndFPP(id: number): Promise<User | null> {
    return await this.repository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.student", "student")
      .innerJoinAndSelect("student.final_project_members", "fpm")
      .innerJoinAndSelect("fpm.final_project", "fp")
      .innerJoinAndSelect("fp.final_project_period", "fpp")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findAllWithPagination(
    query: UserQueryParams & PaginationQuery
  ): Promise<PaginationResult<User>> {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder("user");

    // Left join untuk student dan lecturer
    queryBuilder.leftJoinAndSelect("user.student", "student");
    queryBuilder.leftJoinAndSelect("user.lecturer", "lecturer");

    // Apply filters
    if (query.role) {
      queryBuilder.andWhere("user.role = :role", { role: query.role });
    }

    if (query.semester) {
      queryBuilder.andWhere("user.semester = :semester", {
        semester: query.semester,
      });
    }

    if (query.kelompokKeahlian) {
      queryBuilder.andWhere("user.kelompokKeahlian = :kelompokKeahlian", {
        kelompokKeahlian: query.kelompokKeahlian,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        "(user.name LIKE :search OR user.email LIKE :search OR student.nim LIKE :search OR lecturer.nip LIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    // Apply sorting
    let sortBy = query.sortBy || "created_at";
    const sortOrder = query.sortOrder || "DESC";

    // Map camelCase to snake_case for database columns
    const columnMapping: { [key: string]: string } = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      lastLogin: "last_login",
    };

    sortBy = columnMapping[sortBy] || sortBy;
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder as "ASC" | "DESC");

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async update(id: number, updateData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.repository.update(id, { last_login: new Date() });
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { is_active: false });
    return result.affected ? result.affected > 0 : false;
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  // async countByRole(role: UserRole): Promise<number> {
  //   return await this.repository.count({ where: { role: role as string } });
  // }

  countByRole(role: UserRole): number {
    return 3;
  }

  // ===== RESET PASSWORD METHODS =====

  /**
   * Update reset token untuk user
   */
  async updateResetToken(
    userId: number,
    token: string,
    expires: Date
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({
        reset_token: token,
        reset_token_expires: expires,
      })
      .where("id = :id", { id: userId })
      .execute();
  }

  /**
   * Find user by reset token (include reset token fields dalam select)
   */
  async findByResetToken(token: string): Promise<User | null> {
    const user = await this.repository
      .createQueryBuilder("user")
      .addSelect(["user.reset_token", "user.reset_token_expires"])
      .where("user.reset_token = :token", { token })
      .andWhere("user.reset_token_expires > :now", { now: new Date() })
      .getOne();
    return user || null;
  }

  /**
   * Update password dan clear reset token
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({
        password: hashedPassword,
        reset_token: () => "NULL",
        reset_token_expires: () => "NULL",
      })
      .where("id = :id", { id: userId })
      .execute();
  }

  /**
   * Find lecturer by user ID
   */
  async findLecturerByUserId(userId: number): Promise<Lecturer | null> {
    const lecturerRepository = AppDataSource.getRepository(Lecturer);
    return await lecturerRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  /**
   * Find student by user ID
   */
  async findStudentByUserId(userId: number): Promise<Student | null> {
    return await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  /**
   * Find student profile with final project and supervisors
   */
  async findStudentProfileWithProjectAndSupervisors(
    userId: number
  ): Promise<User | null> {
    return await this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.student", "student")
      .leftJoinAndSelect("student.final_project_members", "fpm")
      .leftJoinAndSelect("fpm.final_project", "fp")
      .leftJoinAndSelect("fp.supervisor_1", "sup1")
      .leftJoinAndSelect("sup1.user", "sup1_user")
      .leftJoinAndSelect("fp.supervisor_2", "sup2")
      .leftJoinAndSelect("sup2.user", "sup2_user")
      .where("user.id = :id", { id: userId })
      .getOne();
  }
}
