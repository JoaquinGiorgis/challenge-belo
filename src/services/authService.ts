import bcrypt from 'bcrypt'
import prisma from '../config/database.js'
import { RegisterInput, LoginInput, UserResponse } from '../schemas/auth.js'

const SALT_ROUNDS = 12

class AuthService {
  /**
   * Registra un nuevo usuario
   * @param userData - Datos del usuario (email, nombre, password)
   * @returns Usuario creado (sin password)
   */
  async register({ email, nombre, password }: RegisterInput): Promise<UserResponse> {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      const error = new Error('El email ya está registrado') as Error & { statusCode: number }
      error.statusCode = 409
      throw error
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        nombre,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        saldo: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return {
      ...user,
      saldo: parseFloat(user.saldo.toString())
    }
  }

  /**
   * Autentica un usuario
   * @param credentials - Credenciales (email, password)
   * @returns Usuario autenticado (sin password)
   */
  async login({ email, password }: LoginInput): Promise<UserResponse> {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      const error = new Error('Credenciales inválidas') as Error & { statusCode: number }
      error.statusCode = 401
      throw error
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      const error = new Error('Credenciales inválidas') as Error & { statusCode: number }
      error.statusCode = 401
      throw error
    }

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user
    return {
      ...userWithoutPassword,
      saldo: parseFloat(userWithoutPassword.saldo.toString())
    }
  }

  /**
   * Obtiene un usuario por ID
   * @param userId - ID del usuario
   * @returns Usuario (sin password)
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        saldo: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      const error = new Error('Usuario no encontrado') as Error & { statusCode: number }
      error.statusCode = 404
      throw error
    }

    return {
      ...user,
      saldo: parseFloat(user.saldo.toString())
    }
  }
}

export default new AuthService()
