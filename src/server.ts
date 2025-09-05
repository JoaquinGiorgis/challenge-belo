import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import env from './config/env.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'

// Crear instancia de Fastify
const fastify = Fastify({
  logger: env.NODE_ENV === 'development' ? {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : {
    level: 'info'
  },
})

// Función para configurar plugins de seguridad
async function setupSecurity(): Promise<void> {
  // CORS
  await fastify.register(import('@fastify/cors'), {
    origin: env.NODE_ENV === 'production' 
      ? ['https://tudominio.com'] // Configurar según tu dominio en producción
      : true, // Permitir cualquier origen en desarrollo
    credentials: true,
  })

  // Helmet para headers de seguridad
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })

  // Rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: 100, // máximo 100 requests
    timeWindow: '1 minute', // por minuto
    errorResponseBuilder: function (request: FastifyRequest, context: any) {
      return {
        error: 'Rate limit excedido',
        message: `Solo se permiten ${context.max} requests por ${context.after}. Intenta de nuevo más tarde.`,
        expiresIn: Math.round(context.ttl / 1000), // tiempo en segundos hasta que expire el límite
      }
    }
  })
}

// Función para configurar JWT
async function setupJWT(): Promise<void> {
  await fastify.register(import('@fastify/jwt'), {
    secret: env.JWT_SECRET,
    sign: {
      algorithm: 'HS256',
      expiresIn: '7d'
    },
    verify: {
      algorithms: ['HS256']
    }
  })
}

// Función para configurar Swagger
async function setupSwagger(): Promise<void> {
  await fastify.register(import('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Challenge Belo API',
        description: 'API REST con autenticación JWT usando Fastify, Prisma y PostgreSQL',
        version: '1.0.0',
        contact: {
          name: 'Challenge Belo',
          email: 'contacto@challengebelo.com'
        }
      },
      host: `localhost:${env.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {
          name: 'Autenticación',
          description: 'Endpoints relacionados con autenticación de usuarios'
        },
        {
          name: 'Transacciones',
          description: 'Endpoints para manejar transacciones entre usuarios'
        }
      ],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Token JWT en formato: Bearer <token>'
        }
      }
    }
  })

  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request: FastifyRequest, reply: FastifyReply, next: () => void) { next() },
      preHandler: function (request: FastifyRequest, reply: FastifyReply, next: () => void) { next() }
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: any, request: FastifyRequest, reply: FastifyReply) => { return swaggerObject },
    transformSpecificationClone: true
  })
}

// Función para configurar rutas
async function setupRoutes(): Promise<void> {
  // Registrar rutas de autenticación
  await fastify.register(authRoutes, { prefix: '/api/auth' })

  // Registrar rutas de transacciones
  await fastify.register(transactionRoutes, { prefix: '/api/transactions' })
}

// Función para manejar errores
function setupErrorHandling(): void {
  // Handler de errores global
  fastify.setErrorHandler((error: any, request, reply) => {
    // Log del error
    request.log.error(error)

    // Error de validación de Fastify
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Datos inválidos',
        details: error.validation.map((err: any) => ({
          field: err.instancePath.replace('/', '') || err.params?.missingProperty,
          message: err.message
        }))
      })
    }

    // Errores específicos de status code
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.message
      })
    }

    // Error interno del servidor
    return reply.status(500).send({
      success: false,
      error: 'Error interno del servidor'
    })
  })

  // Handler para rutas no encontradas
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'Ruta no encontrada',
      message: `La ruta ${request.method} ${request.url} no existe`
    })
  })
}

// Función principal para inicializar el servidor
async function start(): Promise<void> {
  try {
    // Configurar plugins y middleware
    await setupSecurity()
    await setupJWT()
    await setupSwagger()
    await setupRoutes()
    setupErrorHandling()

    // Iniciar servidor
    await fastify.listen({ 
      port: env.PORT, 
      host: '0.0.0.0' 
    })

    console.log(`🚀 Servidor corriendo en http://localhost:${env.PORT}`)
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

// Manejo de cierre graceful
const gracefulShutdown = async (signal: string): Promise<void> => {
  
  try {
    await fastify.close()
    process.exit(0)
  } catch (error) {
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Iniciar servidor
start()
