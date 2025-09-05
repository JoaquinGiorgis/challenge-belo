import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import authController from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'

async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  // Schemas para Swagger documentation
  const registerSchema = {
    description: 'Registra un nuevo usuario',
    tags: ['Autenticación'],
    body: {
      type: 'object',
      required: ['email', 'nombre', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Email del usuario'
        },
        nombre: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
          description: 'Nombre completo del usuario'
        },
        password: {
          type: 'string',
          minLength: 7,
          maxLength: 100,
          description: 'Password (min 7 chars, debe contener mayúscula, minúscula, número y carácter especial)'
        }
      }
    },
    response: {
      201: {
        description: 'Usuario registrado exitosamente',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  nombre: { type: 'string' },
                  saldo: { type: 'number', description: 'Saldo actual del usuario' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              },
              token: { type: 'string' }
            }
          }
        }
      },
      400: {
        description: 'Datos inválidos',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      409: {
        description: 'Email ya registrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      }
    }
  }

  const loginSchema = {
    description: 'Autentica un usuario',
    tags: ['Autenticación'],
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Email del usuario'
        },
        password: {
          type: 'string',
          description: 'Password del usuario'
        }
      }
    },
    response: {
      200: {
        description: 'Login exitoso',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  nombre: { type: 'string' },
                  saldo: { type: 'number', description: 'Saldo actual del usuario' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              },
              token: { type: 'string' }
            }
          }
        }
      },
      401: {
        description: 'Credenciales inválidas',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      }
    }
  }

  // Ruta de registro
  fastify.post('/register', {
    schema: registerSchema
  }, authController.register)

  // Ruta de login
  fastify.post('/login', {
    schema: loginSchema
  }, authController.login)
}

export default authRoutes
