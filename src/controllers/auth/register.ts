import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { AuthService } from "@/services/auth/AuthServices";

// Register Student
export const register = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const registerService = new AuthService();
    const result = await registerService.register(req.body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    // cookie for middleware authentication
    const isProduction = process.env.NODE_ENV === "production";
    const useHttps = process.env.USE_HTTPS === "true";

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction && useHttps, // Must be true for sameSite: "none"
      sameSite: isProduction && useHttps ? "none" : "lax", // "none" requires secure: true
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Add domain if set (use parent domain like .gata.web.id for cross-subdomain)
    // Leave empty to default to current domain only
    if (process.env.COOKIE_DOMAIN) {
      let domain = process.env.COOKIE_DOMAIN.replace(
        /^https?:\/\//,
        ""
      ).replace(/\/$/, "");
      cookieOptions.domain = domain;
    }

    res.cookie("token", result.token, cookieOptions);

    return res.status(201).json({
      message: "Registrasi student berhasil",
      data: {
        token: result.token,
        user: {
          email: result.user.email,
          role: result.user.role,
          name: result.user.name,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

// Register Dosen - Updated to use 'nip' instead of 'nim'
// export const registerDosen = async (req: Request, res: Response) => {
//   try {
//     const { nama, nip, email, password, nomorWhatsapp, kelompokKeahlian } =
//       req.body;

//     const userRepo = new UserRepository();

//     // Cek kalau nip atau email sudah ada
//     const existingUser = await userRepo.findByEmailOrNim(email, nip);
//     // if (existingUser) {
//     //   if (existingUser.nim === nip) {
//     //     return res.status(400).json({
//     //       success: false,
//     //       message: "NIP sudah terdaftar",
//     //     });
//     //   }
//     //   if (existingUser.email === email.toLowerCase()) {
//     //     return res.status(400).json({
//     //       success: false,
//     //       message: "Email sudah terdaftar",
//     //     });
//     //   }
//     // }

//     // Validasi email harus dosen
//     if (!email.endsWith("@if.itera.ac.id")) {
//       return res.status(400).json({
//         success: false,
//         message: "Hanya email @if.itera.ac.id yang diperbolehkan untuk dosen",
//       });
//     }

//     // Validasi input required untuk dosen
//     if (!nama || !nip || !email || !password || !kelompokKeahlian) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Nama, NIP, email, password, dan kelompok keahlian wajib diisi",
//       });
//     }

//     // Validasi kelompok keahlian
//     const validKelompokKeahlian = ["RPLSI", "AIDE", "KMSI"];
//     if (!validKelompokKeahlian.includes(kelompokKeahlian)) {
//       return res.status(400).json({
//         success: false,
//         message: "Kelompok keahlian harus salah satu dari: RPLSI, AIDE, KMSI",
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user data - store nip in nim field (for database consistency)
//     const userData = {
//       name: nama,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       // role: "dosen" as UserRole,
//       // semester: undefined, // Dosen tidak punya semester
//       // kelompokKeahlian: kelompokKeahlian as ExpertisesGroup,
//       // nomorWhatsapp: nomorWhatsapp || undefined,
//     };

//     // Save user using repository
//     const newUser = await userRepo.create(userData);

//     return res.status(201).json({
//       success: true,
//       message: "Registrasi dosen berhasil",
//       data: {
//         id: newUser.id,
//         // nama: newUser.nama,
//         // nip: newUser.nim, // Return as 'nip' in response for clarity
//         // email: newUser.email,
//         // role: newUser.role,
//         // kelompokKeahlian: newUser.kelompokKeahlian,
//         // nomorWhatsapp: newUser.nomorWhatsapp,
//         isActive: newUser.isActive,
//         createdAt: newUser.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error("Dosen registration error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Terjadi kesalahan server",
//     });
//   }
// };

// Register Admin (hanya bisa dilakukan oleh admin lain, bisa di route terpisah)
// export const registerAdmin = async (req: Request, res: Response) => {
//   try {
//     const { name, nim, email, password, nomorWhatsapp } = req.body;

//     const userRepo = new UserRepository();

//     // Cek kalau nim atau email sudah ada
//     const existingUser = await userRepo.findByEmailOrNim(email, nim);
//     // if (existingUser) {
//     //   if (existingUser.nim === nim) {
//     //     return res.status(400).json({
//     //       success: false,
//     //       message: "NIM/ID sudah terdaftar",
//     //     });
//     //   }
//     //   if (existingUser.email === email.toLowerCase()) {
//     //     return res.status(400).json({
//     //       success: false,
//     //       message: "Email sudah terdaftar",
//     //     });
//     //   }
//     // }

//     // Validasi email admin (gmail)
//     if (!email.endsWith("@gmail.com")) {
//       return res.status(400).json({
//         success: false,
//         message: "Hanya email @gmail.com yang diperbolehkan untuk admin",
//       });
//     }

//     // Validasi input required
//     if (!name || !nim || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Nama, ID, email, dan password wajib diisi",
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user data
//     const userData = {
//       name: name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       // role: "admin" as UserRole,
//       // semester: undefined,
//       // nomorWhatsapp: nomorWhatsapp || undefined,
//     };

//     // Save user using repository
//     const newUser = await userRepo.create(userData);

//     return res.status(201).json({
//       success: true,
//       message: "Registrasi admin berhasil",
//       data: {
//         id: newUser.id,
//         // nama: newUser.nama,
//         // nim: newUser.nim,
//         // email: newUser.email,
//         // role: newUser.role,
//         // nomorWhatsapp: newUser.nomorWhatsapp,
//         isActive: newUser.isActive,
//         createdAt: newUser.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error("Admin registration error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Terjadi kesalahan server",
//     });
//   }
// };

// Generic register function (opsional - bisa digunakan jika ingin satu endpoint untuk semua)
// export const register = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.body;

//     // Auto-detect role berdasarkan email domain
//     if (email.endsWith("@student.itera.ac.id")) {
//       return registerStudent(req, res);
//     } else if (email.endsWith("@if.itera.ac.id")) {
//       return registerDosen(req, res);
//     } else if (email.endsWith("@gmail.com")) {
//       return registerAdmin(req, res);
//     } else {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Domain email tidak dikenali. Gunakan @student.itera.ac.id untuk mahasiswa, @if.itera.ac.id untuk dosen, atau @gmail.com untuk admin.",
//       });
//     }
//   } catch (error) {
//     console.error("Registration error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Terjadi kesalahan server",
//     });
//   }
// };
