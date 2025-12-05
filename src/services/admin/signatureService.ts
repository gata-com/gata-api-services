import * as fs from "fs";
import * as path from "path";
import { SignatureRepository } from "@/repositories/SignatureRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { Signature } from "@/entities/signature";

export class SignatureService {
  private signatureRepo: SignatureRepository;
  private lecturerRepo: LecturerRepository;
  private storageDir: string;

  constructor() {
    this.signatureRepo = new SignatureRepository();
    this.lecturerRepo = new LecturerRepository();

    // Setup paths sesuai development atau production
    const basePath = process.cwd();
    const isProduction =
      basePath.includes("dist") || !fs.existsSync(path.join(basePath, "src"));

    if (isProduction) {
      this.storageDir = path.join(basePath, "storages/signatures");
    } else {
      this.storageDir = path.join(basePath, "src/storages/signatures");
    }

    // Pastikan storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Validate base64 signature data
   * Menerima base64 PNG/JPG dan validate formatnya
   */
  private validateBase64(base64Data: string): boolean {
    // Check if starts with data URL format
    const dataUrlRegex = /^data:image\/(png|jpg|jpeg);base64,/;
    return dataUrlRegex.test(base64Data);
  }

  /**
   * Extract base64 string dari data URL
   * Input: "data:image/png;base64,iVBORw0KG..."
   * Output: "iVBORw0KG..."
   */
  private extractBase64(base64Data: string): string {
    return base64Data.replace(/^data:image\/\w+;base64,/, "");
  }

  /**
   * Save signature file to disk
   * Menerima base64 data dan simpan sebagai file PNG
   */
  async saveSignatureFile(
    lecturerId: number,
    base64Data: string
  ): Promise<string> {
    try {
      // Validate format
      if (!this.validateBase64(base64Data)) {
        throw new Error(
          "Invalid base64 format. Expected: data:image/png;base64,..."
        );
      }

      // Get lecturer untuk get NIP (untuk naming)
      const lecturer = await this.lecturerRepo.findById(lecturerId);
      if (!lecturer) {
        throw new Error("Lecturer not found");
      }

      // Extract base64 string
      const base64String = this.extractBase64(base64Data);

      // Convert base64 to buffer
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64String, "base64");
      } catch (error) {
        throw new Error("Invalid base64 string");
      }

      // Validate buffer size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new Error(
          `File size too large. Max: 5MB, Got: ${(
            buffer.length /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
      }

      // Validate PNG/JPG magic bytes
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50; // PNG magic: 89 50
      const isJpg =
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[buffer.length - 2] === 0xff &&
        buffer[buffer.length - 1] === 0xd9; // JPG magic: FF D8 ... FF D9

      if (!isPng && !isJpg) {
        throw new Error("File is not a valid PNG or JPG image");
      }

      // Generate filename: SIGNATURE_[NIP]_[TIMESTAMP].png
      const timestamp = Date.now();
      const extension = isPng ? "png" : "jpg";
      const fileName = `SIGNATURE_${lecturer.nip}_${timestamp}.${extension}`;
      const filePath = path.join(this.storageDir, fileName);

      // Write file to disk
      fs.writeFileSync(filePath, buffer);

      // Return relative URL path untuk database
      const urlPath = `/signatures/${fileName}`;

      console.log(
        `✓ Signature file saved: ${filePath} (${(buffer.length / 1024).toFixed(
          2
        )}KB)`
      );
      return urlPath;
    } catch (error) {
      console.error("✗ Error saving signature file:", error);
      throw new Error(
        `Gagal menyimpan file signature: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update or create signature
   * Delete old file, save new file, update database
   */
  async updateSignature(
    lecturerId: number,
    base64Data: string
  ): Promise<Signature> {
    try {
      // Get existing signature
      const existingSignature = await this.signatureRepo.findByLecturerId(
        lecturerId
      );

      // Delete old file jika ada
      if (existingSignature?.signature_url) {
        this.deleteSignatureFile(existingSignature.signature_url);
      }

      // Save new file ke disk
      const newSignatureUrl = await this.saveSignatureFile(
        lecturerId,
        base64Data
      );

      // Update or create database record
      let savedSignature: Signature;

      if (existingSignature) {
        // Update existing
        const updated = await this.signatureRepo.update(existingSignature.id, {
          signature_url: newSignatureUrl,
          signature_data: undefined, // Clear old data untuk save storage
        });
        if (!updated) {
          throw new Error("Failed to update signature record");
        }
        savedSignature = updated;
      } else {
        // Create new
        const created = await this.signatureRepo.create({
          lecturer: { id: lecturerId } as any,
          signature_url: newSignatureUrl,
          signature_data: undefined,
        });
        if (!created) {
          throw new Error("Failed to create signature record");
        }
        savedSignature = created;
      }

      console.log(`✓ Signature updated for lecturer ${lecturerId}`);
      return savedSignature;
    } catch (error) {
      console.error("✗ Error updating signature:", error);
      throw error;
    }
  }

  /**
   * Delete signature file from disk
   */
  private deleteSignatureFile(signatureUrl: string): void {
    try {
      // Extract filename dari URL: /signatures/SIGNATURE_12345_1234567890.png
      const fileName = signatureUrl.split("/").pop();
      if (!fileName) return;

      const filePath = path.join(this.storageDir, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✓ Old signature file deleted: ${filePath}`);
      }
    } catch (error) {
      console.error("✗ Error deleting signature file:", error);
      // Jangan throw, biar proses continue
    }
  }

  /**
   * Get signature by lecturer ID
   */
  async getSignatureByLecturerId(
    lecturerId: number
  ): Promise<Signature | null> {
    return await this.signatureRepo.findByLecturerId(lecturerId);
  }

  /**
   * Get absolute file path untuk serve/download
   */
  getFilePath(signatureUrl: string): string {
    if (!signatureUrl) {
      throw new Error("Signature URL is empty");
    }

    // Convert URL path ke file path
    // /signatures/SIGNATURE_12345_1234567890.png -> storageDir/SIGNATURE_12345_1234567890.png
    const fileName = signatureUrl.split("/").pop() || "";
    if (!fileName) {
      throw new Error("Invalid signature URL format");
    }

    const filePath = path.join(this.storageDir, fileName);
    return filePath;
  }

  /**
   * Check if signature file exists
   */
  fileExists(signatureUrl: string): boolean {
    try {
      const filePath = this.getFilePath(signatureUrl);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Get file size in bytes
   */
  getFileSize(signatureUrl: string): number {
    try {
      const filePath = this.getFilePath(signatureUrl);
      if (!fs.existsSync(filePath)) return 0;
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Read signature file dan return sebagai buffer
   */
  readSignatureFile(signatureUrl: string): Buffer {
    const filePath = this.getFilePath(signatureUrl);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Signature file not found: ${signatureUrl}`);
    }
    return fs.readFileSync(filePath);
  }

  /**
   * Delete signature completely (file + database)
   */
  async deleteSignature(lecturerId: number): Promise<void> {
    try {
      const signature = await this.signatureRepo.findByLecturerId(lecturerId);

      if (!signature) {
        throw new Error("Signature not found");
      }

      // Delete file
      if (signature.signature_url) {
        this.deleteSignatureFile(signature.signature_url);
      }

      // Delete from database
      await this.signatureRepo.delete(signature.id);

      console.log(`✓ Signature completely deleted for lecturer ${lecturerId}`);
    } catch (error) {
      console.error("✗ Error deleting signature:", error);
      throw error;
    }
  }
}
