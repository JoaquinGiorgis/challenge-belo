import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import transactionController from '../controllers/transactionController.js'
import { authenticateToken } from '../middleware/auth.js'

async function transactionRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  // Schemas para Swagger documentation
  const createTransactionSchema = {
    description: 'Crear una nueva transacción entre usuarios',
    tags: ['Transacciones'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['destinoId', 'monto'],
      properties: {
        destinoId: {
          type: 'string',
          description: 'ID del usuario destino'
        },
        monto: {
          type: 'number',
          minimum: 0.01,
          maximum: 1000000,
          description: 'Monto a transferir (máximo $1,000,000)'
        }
      }
    },
    response: {
      201: {
        description: 'Transacción procesada exitosamente',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              transaccion: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  origenId: { type: 'string' },
                  destinoId: { type: 'string' },
                  monto: { type: 'number' },
                  estado: { type: 'string', enum: ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA'] },
                  fecha: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      202: {
        description: 'Transacción creada y pendiente de aprobación',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              transaccion: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  origenId: { type: 'string' },
                  destinoId: { type: 'string' },
                  monto: { type: 'number' },
                  estado: { type: 'string', enum: ['PENDIENTE'] },
                  fecha: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      400: {
        description: 'Datos inválidos o error de validación',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      },
      401: {
        description: 'No autorizado',
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }

  const getAllUserTransactionsSchema = {
    description: 'Obtener todas las transacciones de un usuario específico (endpoint administrativo)',
    tags: ['Transacciones'],
    security: [{ bearerAuth: [] }],
    querystring: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario para consultar sus transacciones'
        },
        page: {
          type: 'string',
          description: 'Número de página (opcional, por defecto 1)'
        },
        limit: {
          type: 'string',
          description: 'Límite de resultados por página (opcional, por defecto 10)'
        },
        estado: {
          type: 'string',
          enum: ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA'],
          description: 'Filtrar por estado de transacción (opcional)'
        },
        fechaDesde: {
          type: 'string',
          format: 'date',
          description: 'Fecha desde para filtrar (opcional, formato YYYY-MM-DD)'
        },
        fechaHasta: {
          type: 'string',
          format: 'date',
          description: 'Fecha hasta para filtrar (opcional, formato YYYY-MM-DD)'
        }
      }
    },
    response: {
      200: {
        description: 'Lista de transacciones obtenida exitosamente',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              transacciones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    origenId: { type: 'string' },
                    destinoId: { type: 'string' },
                    monto: { type: 'number' },
                    estado: { type: 'string', enum: ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA'] },
                    fecha: { type: 'string', format: 'date-time' },
                    tipo: { type: 'string', enum: ['ENVIADA', 'RECIBIDA'] },
                    origen: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        nombre: { type: 'string' }
                      }
                    },
                    destino: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        nombre: { type: 'string' }
                      }
                    }
                  }
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                  hasNext: { type: 'boolean' },
                  hasPrev: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      400: {
        description: 'Parámetros de consulta inválidos',
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
      401: {
        description: 'No autorizado',
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }

  const approveTransactionSchema = {
    description: 'Aprobar una transacción pendiente',
    tags: ['Transacciones'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'ID de la transacción a aprobar'
        }
      }
    },
    response: {
      200: {
        description: 'Transacción aprobada exitosamente',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              transaccion: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  origenId: { type: 'string' },
                  destinoId: { type: 'string' },
                  monto: { type: 'number' },
                  estado: { type: 'string', enum: ['CONFIRMADA'] },
                  fecha: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      400: {
        description: 'Error en la solicitud',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      },
      401: {
        description: 'No autorizado',
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      },
      404: {
        description: 'Transacción no encontrada',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      }
    }
  }

  const rejectTransactionSchema = {
    description: 'Rechazar una transacción pendiente',
    tags: ['Transacciones'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'ID de la transacción a rechazar'
        }
      }
    },
    response: {
      200: {
        description: 'Transacción rechazada exitosamente',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              transaccion: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  origenId: { type: 'string' },
                  destinoId: { type: 'string' },
                  monto: { type: 'number' },
                  estado: { type: 'string', enum: ['RECHAZADA'] },
                  fecha: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      400: {
        description: 'Error en la solicitud',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      },
      401: {
        description: 'No autorizado',
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      },
      404: {
        description: 'Transacción no encontrada',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      }
    }
  }

  // Aplicar middleware de autenticación a todas las rutas
  fastify.addHook('preHandler', authenticateToken)

  // Rutas de transacciones
  fastify.post('/', {
    schema: createTransactionSchema
  }, transactionController.createTransaction)

  fastify.get('/', {
    schema: getAllUserTransactionsSchema
  }, transactionController.getAllUserTransactions)

  fastify.patch('/:id/approve', {
    schema: approveTransactionSchema
  }, transactionController.approveTransaction)

  fastify.patch('/:id/reject', {
    schema: rejectTransactionSchema
  }, transactionController.rejectTransaction)
}

export default transactionRoutes
