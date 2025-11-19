import { v4 as uuidv4 } from "uuid";
import AppDataSource from "../config/data-source";
import { RentangNilai } from "../entities/rentangNilai";

/**
 * Seed rentang nilai (grade ranges)
 * Default grade system: A, AB, B, BC, C, D, E
 */
export async function seedRentangNilai(): Promise<void> {
  const rentangNilaiRepo = AppDataSource.getRepository(RentangNilai);

  // Check if already seeded
  const existing = await rentangNilaiRepo.count();
  if (existing > 0) {
    console.log("⏭️  Rentang nilai already seeded, skipping...");
    return;
  }

  const rentangNilais = [
    {
      id: uuidv4(),
      grade: "A",
      minScore: 80.0,
      urutan: 1,
      isActive: true,
    },
    {
      id: uuidv4(),
      grade: "AB",
      minScore: 75.0,
      urutan: 2,
      isActive: true,
    },
    {
      id: uuidv4(),
      grade: "B",
      minScore: 70.0,
      urutan: 3,
      isActive: true,
    },
    {
      id: uuidv4(),
      grade: "BC",
      minScore: 65.0,
      urutan: 4,
      isActive: true,
    },
    {
      id: uuidv4(),
      grade: "C",
      minScore: 60.0,
      urutan: 5,
      isActive: true,
    },
    {
      id: uuidv4(),
      grade: "D",
      minScore: 50.0,
      urutan: 6,
      isActive: true,
    },
    {
      id: uuidv4(),
      grade: "E",
      minScore: 0.0,
      urutan: 7,
      isActive: true,
    },
  ];

  await rentangNilaiRepo.save(rentangNilais);

  console.log("✅ Rentang nilai seeded successfully!");
}
