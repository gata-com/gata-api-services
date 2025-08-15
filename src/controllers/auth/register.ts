// controllers/auth/register.ts
import { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { User } from "../../entities/user";
import { validate } from "class-validator";

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log('=== REGISTER ENDPOINT START ===');
  console.log('Request body:', req.body);
  
  try {
    const { nama, email, password, nim, semester, nomor_whatsapp, role } = req.body;

    // Validasi input dasar
    if (!nama || !email || !password || !nim || !semester || !nomor_whatsapp) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        message: "Semua field wajib diisi (nama, email, password, nim, semester, nomor_whatsapp)",
      });
    }

    console.log('Step 1: Basic validation passed');

    // Get User repository
    const userRepository = AppDataSource.getRepository(User);
    
    // Cek user sudah ada berdasarkan email atau nim
    console.log('Step 2: Checking existing user...');
    const existingUser = await userRepository.findOne({
      where: [
        { email: email },
        { nim: nim }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }
      if (existingUser.nim === nim) {
        return res.status(400).json({ message: "NIM sudah terdaftar" });
      }
    }

    console.log('Step 3: User doesn\'t exist, creating new user...');

    // Buat instance User baru
    const newUser = userRepository.create({
      nim,
      nama,
      email,
      password, // Password akan di-hash otomatis oleh @BeforeInsert hook
      semester: parseInt(semester), // Convert ke number sesuai entity
      nomorWhatsapp: nomor_whatsapp,
      role: role || 'student', // Default role student
      isActive: true
    });

    console.log('Step 4: User instance created');

    // Validasi menggunakan class-validator
    const validationErrors = await validate(newUser);
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      const errorMessages = validationErrors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      
      return res.status(400).json({
        message: "Data tidak valid",
        errors: errorMessages
      });
    }

    console.log('Step 5: Class validation passed');

    // Simpan ke database
    const savedUser = await userRepository.save(newUser);
    console.log('Step 6: User saved successfully with ID:', savedUser.id);

    // Return response tanpa password (toJSON() sudah handle ini)
    return res.status(201).json({
      message: "Registrasi berhasil",
      user: savedUser.toJSON()
    });
    
  } catch (error: any) {
    console.error('=== ERROR OCCURRED ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Full error:', error);
    console.error('=== END ERROR ===');
    
    // Handle TypeORM/MySQL duplicate entry error
    if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('Duplicate entry')) {
      if (error?.message?.includes('nim') || error?.message?.includes('users.nim')) {
        return res.status(400).json({ message: "NIM sudah terdaftar" });
      }
      if (error?.message?.includes('email') || error?.message?.includes('users.email')) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }
      return res.status(400).json({ message: "Data sudah terdaftar" });
    }
    
    // Handle validation errors from database constraints
    if (error?.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ message: "Data terlalu panjang untuk salah satu field" });
    }
    
    if (error?.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ message: "Field wajib tidak boleh kosong" });
    }
    
    return res.status(500).json({ 
      message: "Terjadi kesalahan server", 
      error: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        code: error?.code,
      } : {}
    });
  }
};