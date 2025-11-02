export interface FinalProjectSearchByQueryRequest {
  query: string;
}

export interface FinalProjectCreateRequest {
  type: string;
  status: string;
  source_topic: string;
  supervisor1Id: string;
  supervisor2Id: string;
  finalProjectPeriodId: string;
  members: FinalProjectData[];
}

export interface FinalProjectData {
  email: string;
  studentId: string;
  title: string;
  resume: string;
  draft_path?: Express.Multer.File | null;
  dispen_path?: Express.Multer.File | null;
}

export interface FPChangeSupervisorRequest {
  fpId: number;
  supervisor_1: number | null;
  supervisor_2: number | null;
}
