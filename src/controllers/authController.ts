import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import authService from '../services/authService.js'
import { registerSchema, loginSchema } from '../schemas/auth.js'

class AuthController {
  /**
   * Registra un nuevo usuario
   */
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = registerSchema.parse(request.body)
      
      // Registrar usuario
      const user = await authService.register(validatedData)
      
      // Generar token JWT
      const token = await reply.jwtSign(
        { userId: user.id },
        { expiresIn: '7d' }
      )
      
      return reply.status(201).send({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user,
          token
        }
      })
    } catch (error) {
      // Error de validación
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        })
      }
      
      // Error del servicio (usuario duplicado, etc.)
      if ((error as any).statusCode) {
        return reply.status((error as any).statusCode).send({
          success: false,
          error: (error as Error).message
        })
      }
      
      // Error interno del servidor
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }

  /**
   * Autentica un usuario (login)
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = loginSchema.parse(request.body)
      
      // Autenticar usuario
      const user = await authService.login(validatedData)
      
      // Generar token JWT
      const token = await reply.jwtSign(
        { userId: user.id },
        { expiresIn: '7d' }
      )
      
      return reply.send({
        success: true,
        message: 'Login exitoso',
        data: {
          user,
          token
        }
      })
    } catch (error) {
      // Error de validación
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        })
      }
      
      // Error del servicio (credenciales inválidas, etc.)
      if ((error as any).statusCode) {
        return reply.status((error as any).statusCode).send({
          success: false,
          error: (error as Error).message
        })
      }
      
      // Error interno del servidor
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}

export default new AuthController()
