import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserRepository } from "../../repositories/userRepository";
import { UserRole, RegisterRequest, KelompokKeahlian } from "../../types/user";

// Register Student
export const registerStudent = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { name, nim, email, password, semester, nomorWhatsapp } = req.body;

    const userRepo = new UserRepository();

    // Cek kalau nim atau email sudah ada
    const existingUser = await userRepo.findByEmailOrNim(email, nim);
    if (existingUser) {
      if (existingUser.nim === nim) {
        return res.status(400).json({ 
          success: false,
          message: "NIM sudah terdaftar" 
        });
      }
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ 
          success: false,
          message: "Email sudah terdaftar" 
        });
      }
    }

    // Validasi email harus student
    if (!email.endsWith("@student.itera.ac.id")) {
      return res.status(400).json({ 
        success: false,
        message: "Hanya email student.itera.ac.id yang diperbolehkan" 
      });
    }

    // Validasi input required untuk student
    if (!name || !nim || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, NIM, email, dan password wajib diisi"
      });
    }

    // Validasi semester untuk student
    if (semester && (semester < 1 || semester > 14)) {
      return res.status(400).json({
        success: false,
        message: "Semester harus antara 1-14"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    const userData = {
      nama: name,
      nim,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "student" as UserRole,
      semester: semester || undefined,
      nomorWhatsapp: nomorWhatsapp || undefined
    };

    // Save user using repository
    const newUser = await userRepo.create(userData);

    return res.status(201).json({
      success: true,
      message: "Registrasi student berhasil",
      data: {
        id: newUser.id,
        nama: newUser.nama,
        nim: newUser.nim,
        email: newUser.email,
        role: newUser.role,
        semester: newUser.semester,
        nomorWhatsapp: newUser.nomorWhatsapp,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan server" 
    });
  }
};

// Register Dosen - Updated to use 'nip' instead of 'nim'
export const registerDosen = async (req: Request, res: Response) => {
  try {
    const { nama, nip, email, password, nomorWhatsapp, kelompokKeahlian } = req.body;

    const userRepo = new UserRepository();

    // Cek kalau nip atau email sudah ada
    const existingUser = await userRepo.findByEmailOrNim(email, nip);
    if (existingUser) {
      if (existingUser.nim === nip) {
        return res.status(400).json({ 
          success: false,
          message: "NIP sudah terdaftar" 
        });
      }
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ 
          success: false,
          message: "Email sudah terdaftar" 
        });
      }
    }

    // Validasi email harus dosen
    if (!email.endsWith("@if.itera.ac.id")) {
      return res.status(400).json({ 
        success: false,
        message: "Hanya email @if.itera.ac.id yang diperbolehkan untuk dosen" 
      });
    }

    // Validasi input required untuk dosen
    if (!nama || !nip || !email || !password || !kelompokKeahlian) {
      return res.status(400).json({
        success: false,
        message: "Nama, NIP, email, password, dan kelompok keahlian wajib diisi"
      });
    }

    // Validasi kelompok keahlian
    const validKelompokKeahlian = ['RPLSI', 'AIDE', 'KMSI'];
    if (!validKelompokKeahlian.includes(kelompokKeahlian)) {
      return res.status(400).json({
        success: false,
        message: "Kelompok keahlian harus salah satu dari: RPLSI, AIDE, KMSI"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data - store nip in nim field (for database consistency)
    const userData = {
      nama: nama,
      nim: nip, // Store NIP in nim field for database consistency
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "dosen" as UserRole,
      semester: undefined, // Dosen tidak punya semester
      kelompokKeahlian: kelompokKeahlian as KelompokKeahlian,
      nomorWhatsapp: nomorWhatsapp || undefined
    };

    // Save user using repository
    const newUser = await userRepo.create(userData);

    return res.status(201).json({
      success: true,
      message: "Registrasi dosen berhasil",
      data: {
        id: newUser.id,
        nama: newUser.nama,
        nip: newUser.nim, // Return as 'nip' in response for clarity
        email: newUser.email,
        role: newUser.role,
        kelompokKeahlian: newUser.kelompokKeahlian,
        nomorWhatsapp: newUser.nomorWhatsapp,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      },
    });
  } catch (error) {
    console.error("Dosen registration error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan server" 
    });
  }
};

// Register Admin (hanya bisa dilakukan oleh admin lain, bisa di route terpisah)
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { name, nim, email, password, nomorWhatsapp } = req.body;

    const userRepo = new UserRepository();

    // Cek kalau nim atau email sudah ada
    const existingUser = await userRepo.findByEmailOrNim(email, nim);
    if (existingUser) {
      if (existingUser.nim === nim) {
        return res.status(400).json({ 
          success: false,
          message: "NIM/ID sudah terdaftar" 
        });
      }
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ 
          success: false,
          message: "Email sudah terdaftar" 
        });
      }
    }

    // Validasi email admin (gmail)
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ 
        success: false,
        message: "Hanya email @gmail.com yang diperbolehkan untuk admin" 
      });
    }

    // Validasi input required
    if (!name || !nim || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, ID, email, dan password wajib diisi"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    const userData = {
      nama: name,
      nim, // Untuk admin ini bisa employee ID
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin" as UserRole,
      semester: undefined,
      nomorWhatsapp: nomorWhatsapp || undefined
    };

    // Save user using repository
    const newUser = await userRepo.create(userData);

    return res.status(201).json({
      success: true,
      message: "Registrasi admin berhasil",
      data: {
        id: newUser.id,
        nama: newUser.nama,
        nim: newUser.nim,
        email: newUser.email,
        role: newUser.role,
        nomorWhatsapp: newUser.nomorWhatsapp,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      },
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan server" 
    });
  }
};

// Generic register function (opsional - bisa digunakan jika ingin satu endpoint untuk semua)
export const register = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Auto-detect role berdasarkan email domain
    if (email.endsWith("@student.itera.ac.id")) {
      return registerStudent(req, res);
    } else if (email.endsWith("@if.itera.ac.id")) {
      return registerDosen(req, res);
    } else if (email.endsWith("@gmail.com")) {
      return registerAdmin(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: "Domain email tidak dikenali. Gunakan @student.itera.ac.id untuk mahasiswa, @if.itera.ac.id untuk dosen, atau @gmail.com untuk admin."
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan server" 
    });
  }
};