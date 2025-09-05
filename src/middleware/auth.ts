import { FastifyRequest, FastifyReply } from 'fastify'
import authService from '../services/authService.js'
import { UserResponse } from '../schemas/auth.js'

// Extender el tipo FastifyRequest para incluir el usuario
declare module 'fastify' {
  interface FastifyRequest {
    user: UserResponse
  }
}

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario esté autenticado y adjunta la información del usuario a la request
 */
export async function authenticateToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Verificar el token JWT
    const decoded = await request.jwtVerify() as { userId: string }
    
    // Obtener información completa del usuario
    const user = await authService.getUserById(decoded.userId)
    
    // Adjuntar usuario a la request
    request.user = user
  } catch (error: any) {
    // Manejar diferentes tipos de errores JWT
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        error: 'Token de autorización requerido',
        message: 'Debe proporcionar un token de autorización en el header'
      })
    }
    
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      return reply.status(401).send({
        error: 'Token expirado',
        message: 'El token de autorización ha expirado'
      })
    }
    
    if (error.statusCode === 404) {
      return reply.status(401).send({
        error: 'Usuario no válido',
        message: 'El usuario asociado al token no existe'
      })
    }
    
    return reply.status(401).send({
      error: 'Token inválido',
      message: 'El token de autorización no es válido'
    })
  }
}
