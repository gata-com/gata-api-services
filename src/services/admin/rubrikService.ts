import { RubrikRepository } from "@/repositories/RubrikRepository";
import { RubrikGroupRepository } from "@/repositories/RubrikGroupRepository";
import { PertanyaanRepository } from "@/repositories/PertanyaanRepository";
import { OpsiJawabanRepository } from "@/repositories/OpsiJawabanRepository";
import { Rubrik } from "../../entities/rubrik";
import { RubrikGroup } from "../../entities/rubrikGroup";
import { Pertanyaan } from "../../entities/pertanyaan";
import { OpsiJawaban } from "../../entities/opsiJawaban";

export class RubrikService {
  private rubrikRepo: RubrikRepository;
  private groupRepo: RubrikGroupRepository;
  private pertanyaanRepo: PertanyaanRepository;
  private opsiRepo: OpsiJawabanRepository;

  constructor() {
    this.rubrikRepo = new RubrikRepository();
    this.groupRepo = new RubrikGroupRepository();
    this.pertanyaanRepo = new PertanyaanRepository();
    this.opsiRepo = new OpsiJawabanRepository();
  }

  // Rubrik Management
  async getAllRubriks(type?: "SID" | "SEM"): Promise<Rubrik[]> {
    return await this.rubrikRepo.findAll(type);
  }

  async getRubrikById(id: string): Promise<Rubrik | null> {
    return await this.rubrikRepo.findById(id);
  }

  async createRubrik(data: {
    nama: string;
    deskripsi?: string;
    type: "SID" | "SEM";
  }): Promise<Rubrik> {
    return await this.rubrikRepo.create(data);
  }

  async updateRubrik(
    id: string,
    data: Partial<Rubrik>
  ): Promise<Rubrik | null> {
    return await this.rubrikRepo.update(id, data);
  }

  async deleteRubrik(id: string): Promise<void> {
    await this.rubrikRepo.delete(id);
  }

  async duplicateRubrik(id: string, newName: string): Promise<Rubrik> {
    return await this.rubrikRepo.duplicate(id, newName);
  }

  async setDefaultRubrik(id: string, type: "SID" | "SEM"): Promise<void> {
    await this.rubrikRepo.setDefault(id, type);
  }

  // Group Management
  async createGroup(data: {
    rubrikId: string;
    nama: string;
    bobotTotal: number;
    urutan: number;
  }): Promise<RubrikGroup> {
    return await this.groupRepo.create(data);
  }

  async updateGroup(
    id: string,
    data: Partial<RubrikGroup>
  ): Promise<RubrikGroup | null> {
    return await this.groupRepo.update(id, data);
  }

  async deleteGroup(id: string): Promise<void> {
    await this.groupRepo.delete(id);
  }

  async reorderGroups(rubrikId: string, groupIds: string[]): Promise<void> {
    await this.groupRepo.reorder(rubrikId, groupIds);
  }

  async setDefaultGroup(groupId: string): Promise<RubrikGroup | null> {
    return await this.groupRepo.setDefault(groupId);
  }

  async unsetDefaultGroup(groupId: string): Promise<RubrikGroup | null> {
    return await this.groupRepo.unsetDefault(groupId);
  }

  async getDefaultGroupByRubrik(rubrikId: string): Promise<RubrikGroup | null> {
    return await this.groupRepo.getDefaultByRubrik(rubrikId);
  }

  // Pertanyaan Management
  async createPertanyaan(data: {
    groupId: string;
    text: string;
    bobot: number;
    urutan: number;
  }): Promise<Pertanyaan> {
    return await this.pertanyaanRepo.create(data);
  }

  async updatePertanyaan(
    id: string,
    data: Partial<Pertanyaan>
  ): Promise<Pertanyaan | null> {
    return await this.pertanyaanRepo.update(id, data);
  }

  async deletePertanyaan(id: string): Promise<void> {
    await this.pertanyaanRepo.delete(id);
  }

  async duplicatePertanyaan(id: string): Promise<Pertanyaan> {
    return await this.pertanyaanRepo.duplicate(id);
  }

  async reorderPertanyaans(
    groupId: string,
    pertanyaanIds: string[]
  ): Promise<void> {
    await this.pertanyaanRepo.reorder(groupId, pertanyaanIds);
  }

  // Opsi Jawaban Management
  async createOpsiJawaban(data: {
    pertanyaanId: string;
    text: string;
    nilai: number;
    urutan: number;
  }): Promise<OpsiJawaban> {
    return await this.opsiRepo.create(data);
  }

  async updateOpsiJawaban(
    id: string,
    data: Partial<OpsiJawaban>
  ): Promise<OpsiJawaban | null> {
    return await this.opsiRepo.update(id, data);
  }

  async deleteOpsiJawaban(id: string): Promise<void> {
    await this.opsiRepo.delete(id);
  }

  async bulkDeleteOpsiJawaban(ids: string[]): Promise<void> {
    await this.opsiRepo.bulkDelete(ids);
  }
}
