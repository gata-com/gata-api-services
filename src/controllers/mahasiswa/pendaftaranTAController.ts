import { Request, Response } from "express";

export const pendaftaranTA = (req: Request, res: Response) => {
  try {
    const {
      type,
      membersCount,
      status,
      title,
      noveltyResume,
      advisor1,
      advisor2,
      topicSource,
    } = req.body;

    const thesisDraft = req.files && (req.files as any).thesisDraft?.[0];
    const supportingFile = req.files && (req.files as any).supportingFile?.[0];
    const exemptionLetter = req.files && (req.files as any).exemptionLetter?.[0];

    // Validation rules
    if (!type || !["regular", "capstone"].includes(type)) {
      return res.status(400).json({ message: "Invalid type of final project" });
    }
    if (!status || !["new", "dispensation"].includes(status)) {
      return res.status(400).json({ message: "Invalid status of final project" });
    }
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!noveltyResume) {
      return res.status(400).json({ message: "Novelty resume is required" });
    }
    if (!advisor1) {
      return res.status(400).json({ message: "First advisor is required" });
    }
    if (!thesisDraft) {
      return res.status(400).json({ message: "Thesis draft PDF is required" });
    }
    if (status === "dispensation" && !exemptionLetter) {
      return res.status(400).json({ message: "Exemption letter is required for dispensation status" });
    }

    return res.status(201).json({
      message: "Final project registration successful",
      data: {
        type,
        membersCount,
        status,
        title,
        noveltyResume,
        advisor1,
        advisor2,
        topicSource,
        files: {
          thesisDraft: thesisDraft.originalname,
          supportingFile: supportingFile?.originalname,
          exemptionLetter: exemptionLetter?.originalname,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
