import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user';
import { CreateUserData, UpdateUserData, UserQueryParams, UserRole } from '../types/user';
import { PaginationResult, PaginationQuery } from '../types';


export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async create(userData: CreateUserData): Promise<User> {
    const userToCreate = this.repository.create({
      nim: userData.nim,
      nama: userData.nama,
      semester: userData.semester,
      nomorWhatsapp: userData.nomorWhatsapp,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'student',
    });
    return await this.repository.save(userToCreate);
  }

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      select: ['id', 'nim', 'nama', 'semester', 'nomorWhatsapp', 'email', 'password', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
      select: ['id', 'nim', 'nama', 'semester', 'nomorWhatsapp', 'email', 'password', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
    });
  }

  async findByNim(nim: string): Promise<User | null> {
    return await this.repository.findOne({ where: { nim } });
  }

  async findByEmailOrNim(email: string, nim: string): Promise<User | null> {
    return await this.repository.findOne({
      where: [{ email }, { nim }]
    });
  }

  async findAllWithPagination(
    query: UserQueryParams & PaginationQuery
  ): Promise<PaginationResult<User>> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('user');

    // Apply filters
    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query.semester) {
      queryBuilder.andWhere('user.semester = :semester', { semester: query.semester });
    }

    if (typeof query.isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(user.nama LIKE :search OR user.email LIKE :search OR user.nim LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Apply sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

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
        hasPrev: page > 1
      }
    };
  }

  async update(id: number, updateData: UpdateUserData): Promise<User | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.repository.update(id, { lastLogin: new Date() });
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }

  async hardDelete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async countByRole(role: UserRole): Promise<number> {
    return await this.repository.count({ where: { role } });
  }
}