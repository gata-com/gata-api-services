export enum PembimbingType {
  PEMBIMBING1 = 'pembimbing1',
  PEMBIMBING2 = 'pembimbing2'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface PembimbingChangeRequest {
  id: number;
  mahasiswaId: number;
  pendaftaranTAId: number;
  pembimbingType: PembimbingType;
  pembimbingLama?: number;
  dosenBaru?: number;
  alasan: string;
  status: RequestStatus;
  alasanPenolakan?: string;
  approvedBy?: number;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}