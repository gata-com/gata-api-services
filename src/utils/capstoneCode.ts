import AppDataSource from "@/config/database";
import { TempExportCsv } from "@/entities/tempExportCsv";

/**
 * Generate unique 5-letter uppercase capstone code
 * Format: XXXXX (5 random uppercase letters)
 * @returns Promise<string> - Unique capstone code
 */
export async function generateCapstoneCode(): Promise<string> {
  const tempExportCsvRepo = AppDataSource.getRepository(TempExportCsv);
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 5 random uppercase letters
    code = "";
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }

    // Check if code already exists
    const existing = await tempExportCsvRepo.findOne({
      where: { capstone_code: code },
    });

    if (!existing) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error(
      "Failed to generate unique capstone code after multiple attempts"
    );
  }

  return code;
}

/**
 * Validate capstone code format
 * @param code - Code to validate
 * @returns boolean - True if valid format
 */
export function validateCapstoneCode(code: string): boolean {
  const regex = /^[A-Z]{5}$/;
  return regex.test(code);
}
