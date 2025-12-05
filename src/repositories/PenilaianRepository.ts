import AppDataSource from "@/config/database";
import { Penilaian } from "@/entities/penilaian";
import { Repository } from "typeorm";

export class PenilaianRepository {
  private repository: Repository<Penilaian>;

  constructor() {
    this.repository = AppDataSource.getRepository(Penilaian);
  }

  async findAll(): Promise<Penilaian[]> {
    return await this.repository
      .createQueryBuilder("penilaian")
      .leftJoinAndSelect("penilaian.jadwal", "jadwal")
      .leftJoinAndSelect("jadwal.defense_submission", "submission")
      .leftJoinAndSelect("submission.student", "student")
      .leftJoinAndSelect("penilaian.lecturer", "lecturer")
      .leftJoinAndSelect("penilaian.rubrik", "rubrik")
      .leftJoinAndSelect("penilaian.jawabans", "jawabans")
      .orderBy("penilaian.createdAt", "DESC")
      .getMany();
  }

  async findById(id: string): Promise<Penilaian | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findByJadwalId(jadwalId: number): Promise<Penilaian[]> {
    return await this.repository
      .createQueryBuilder("penilaian")
      .leftJoinAndSelect("penilaian.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturer_user")
      .leftJoinAndSelect("penilaian.rubrik", "rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("penilaian.jawabans", "jawabans")
      .leftJoinAndSelect("jawabans.pertanyaan", "jawaban_pertanyaan")
      .leftJoinAndSelect("jawabans.opsiJawaban", "opsiJawaban")
      .where("penilaian.jadwalId = :jadwalId", { jadwalId })
      .orderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .getMany();
  }

  async findByJadwalAndStudent(
    jadwalId: number,
    studentId: number
  ): Promise<Penilaian[]> {
    return await this.repository
      .createQueryBuilder("penilaian")
      .leftJoinAndSelect("penilaian.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturer_user")
      .leftJoinAndSelect("penilaian.rubrik", "rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("penilaian.jawabans", "jawabans")
      .leftJoinAndSelect("jawabans.pertanyaan", "jawaban_pertanyaan")
      .leftJoinAndSelect("jawabans.opsiJawaban", "opsiJawaban")
      .where("penilaian.jadwalId = :jadwalId", { jadwalId })
      .andWhere("penilaian.studentId = :studentId", { studentId })
      .orderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .getMany();
  }

  async findByJadwalAndLecturer(
    jadwalId: number,
    lecturerId: number,
    studentId?: number
  ): Promise<Penilaian | null> {
    const query = this.repository
      .createQueryBuilder("penilaian")
      .leftJoinAndSelect("penilaian.rubrik", "rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("pertanyaans.opsiJawabans", "opsiJawabans")
      .leftJoinAndSelect("penilaian.jawabans", "jawabans")
      .leftJoinAndSelect("jawabans.pertanyaan", "jawaban_pertanyaan")
      .leftJoinAndSelect("jawabans.opsiJawaban", "jawaban_opsi")
      .where("penilaian.jadwalId = :jadwalId", { jadwalId })
      .andWhere("penilaian.lecturerId = :lecturerId", { lecturerId })
      .andWhere("penilaian.studentId = :studentId", { studentId });

    if (studentId) {
      query.andWhere("penilaian.studentId = :studentId", { studentId });
    } else {
      query.andWhere("penilaian.studentId IS NULL");
    }

    return await query
      .orderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .addOrderBy("opsiJawabans.urutan", "ASC")
      .getOne();
  }

  async findByJadwalAndLecturerAll(
    jadwalId: number,
    lecturerId: number,
    studentId?: number
  ): Promise<Penilaian[] | null> {
    const query = this.repository
      .createQueryBuilder("penilaian")
      .leftJoinAndSelect("penilaian.rubrik", "rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("pertanyaans.opsiJawabans", "opsiJawabans")
      .leftJoinAndSelect("penilaian.jawabans", "jawabans")
      .leftJoinAndSelect("jawabans.pertanyaan", "jawaban_pertanyaan")
      .leftJoinAndSelect("jawabans.opsiJawaban", "jawaban_opsi")
      .where("penilaian.jadwalId = :jadwalId", { jadwalId })
      .andWhere("penilaian.lecturerId = :lecturerId", { lecturerId })
      .andWhere("penilaian.studentId = :studentId", { studentId });

    if (studentId) {
      query.andWhere("penilaian.studentId = :studentId", { studentId });
    } else {
      query.andWhere("penilaian.studentId IS NULL");
    }

    return await query
      .orderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .addOrderBy("opsiJawabans.urutan", "ASC")
      .getMany();
  }

  async create(data: Partial<Penilaian>): Promise<Penilaian> {
    const penilaian = this.repository.create(data);
    return await this.repository.save(penilaian);
  }

  async update(
    id: string,
    data: Partial<Penilaian>
  ): Promise<Penilaian | null> {
    await this.repository.update(id, data);
    return await this.repository.findOne({ where: { id } });
  }

  async finalize(
    id: string,
    finalizedByName: string,
    finalizedById?: number
  ): Promise<void> {
    await this.repository.update(id, {
      isFinalized: true,
      finalizedById,
      finalizedByName,
      finalizedAt: new Date(),
    });
  }

  async checkAllFinalized(
    lecturerId: number,
    jadwalId: number,
    studentId: number
  ): Promise<boolean> {
    const penilaians = await this.findByJadwalAndLecturerAll(
      jadwalId,
      lecturerId,
      studentId
    );

    if (!penilaians) {
      return false;
    }
    
    return penilaians.length > 0 && penilaians.every((p) => p.isFinalized);
  }
}
