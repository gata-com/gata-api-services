export interface FinalProjectSearchByQueryRequest {
  query: string;
}

export interface FinalProjectCreateRequest {
  type: string;
  status: string;
  source_topic: string;
  supervisor1Id: string;
  supervisor2Id: string;
  finalProjectPeriodId: string | null;
  members: FinalProjectData[];
}

export interface FinalProjectData {
  email: string;
  student: any;
  title: string;
  resume: string;
  draft_path?: Express.Multer.File | null;
  dispen_path?: Express.Multer.File | null;
}
