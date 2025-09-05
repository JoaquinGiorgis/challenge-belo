import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import transactionService from '../services/transactionService.js'
import { createTransactionSchema, adminTransactionQuerySchema } from '../schemas/transaction.js'

class TransactionController {
  /**
   * Crear una nueva transacción
   */
  async createTransaction(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = createTransactionSchema.parse(request.body)
      const origenId = request.user.id

      // Crear la transacción
      const transaccion = await transactionService.createTransaction(
        origenId,
        validatedData.destinoId,
        validatedData.monto
      )

      const statusCode = transaccion.estado === 'PENDIENTE' ? 202 : 201
      const message = transaccion.estado === 'PENDIENTE' 
        ? 'Transacción creada y pendiente de aprobación manual'
        : 'Transacción procesada exitosamente'

      return reply.status(statusCode).send({
        success: true,
        message,
        data: {
          transaccion: {
            ...transaccion,
            monto: parseFloat(transaccion.monto.toString())
          }
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

      // Error del servicio
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
   * Obtener todas las transacciones de un usuario (endpoint administrativo)
   */
  async getAllUserTransactions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar parámetros de consulta
      const queryParams = adminTransactionQuerySchema.parse(request.query)

      const result = await transactionService.getAllUserTransactions(
        queryParams.userId,
        {
          page: queryParams.page,
          limit: queryParams.limit,
          estado: queryParams.estado || undefined,
          fechaDesde: queryParams.fechaDesde || undefined,
          fechaHasta: queryParams.fechaHasta || undefined
        }
      )

      return reply.send({
        success: true,
        data: result
      })
    } catch (error) {
      // Error de validación
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Parámetros de consulta inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        })
      }

      // Error del servicio
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
   * Aprobar una transacción pendiente específicamente
   */
  async approveTransaction(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const transactionId = (request.params as { id: string }).id
      const adminUserId = request.user.id

      const transaccion = await transactionService.updateTransactionStatus(
        transactionId,
        'CONFIRMADA',
        adminUserId
      )

      return reply.send({
        success: true,
        message: 'Transacción aprobada y procesada exitosamente',
        data: {
          transaccion: {
            ...transaccion,
            monto: parseFloat(transaccion.monto.toString())
          }
        }
      })
    } catch (error) {
      // Error del servicio
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
   * Rechazar una transacción pendiente específicamente
   */
  async rejectTransaction(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const transactionId = (request.params as { id: string }).id
      const adminUserId = request.user.id

      const transaccion = await transactionService.updateTransactionStatus(
        transactionId,
        'RECHAZADA',
        adminUserId
      )

      return reply.send({
        success: true,
        message: 'Transacción rechazada exitosamente',
        data: {
          transaccion: {
            ...transaccion,
            monto: parseFloat(transaccion.monto.toString())
          }
        }
      })
    } catch (error) {
      // Error del servicio
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

export default new TransactionController()
