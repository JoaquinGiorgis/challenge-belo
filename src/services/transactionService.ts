import prisma from '../config/database.js'
import { Decimal } from '@prisma/client/runtime/library'
import { CreateTransactionInput, AdminTransactionQuery } from '../schemas/transaction.js'

const LIMITE_AUTO_APROBACION = new Decimal(50000)

// Tipos para las transacciones
export interface TransactionWithUsers {
  id: string
  origenId: string
  destinoId: string
  monto: Decimal
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA'
  fecha: Date
  origen: {
    id: string
    email: string
    nombre: string
    saldo?: Decimal
  }
  destino: {
    id: string
    email: string
    nombre: string
    saldo?: Decimal
  }
}

export interface TransactionListOptions {
  page?: number
  limit?: number
  estado?: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | undefined
  fechaDesde?: Date | undefined
  fechaHasta?: Date | undefined
}

export interface TransactionListResult {
  transacciones: Array<{
    id: string
    origenId: string
    destinoId: string
    monto: number
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA'
    fecha: Date
    tipo: 'ENVIADA' | 'RECIBIDA'
    origen: {
      id: string
      email: string
      nombre: string
    }
    destino: {
      id: string
      email: string
      nombre: string
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

class TransactionService {
  /**
   * Crear una nueva transacción
   * @param origenId - ID del usuario origen
   * @param destinoId - ID del usuario destino  
   * @param monto - Monto a transferir
   * @returns Transacción creada
   */
  async createTransaction(origenId: string, destinoId: string, monto: number): Promise<TransactionWithUsers> {
    // Validaciones básicas
    if (origenId === destinoId) {
      const error = new Error('No puedes transferir dinero a ti mismo') as Error & { statusCode: number }
      error.statusCode = 400
      throw error
    }

    const montoDecimal = new Decimal(monto)

    // Usar transacción de base de datos para atomicidad
    const result = await prisma.$transaction(async (tx) => {
      // Bloquear el usuario origen para evitar transacciones concurrentes
      const usuarioOrigen = await tx.user.findUnique({
        where: { id: origenId }
      })

      if (!usuarioOrigen) {
        const error = new Error('Usuario origen no encontrado') as Error & { statusCode: number }
        error.statusCode = 404
        throw error
      }

      // Verificar que el usuario destino existe
      const usuarioDestino = await tx.user.findUnique({
        where: { id: destinoId }
      })

      if (!usuarioDestino) {
        const error = new Error('Usuario destino no encontrado') as Error & { statusCode: number }
        error.statusCode = 404
        throw error
      }

      // Verificar saldo suficiente
      if (usuarioOrigen.saldo.lt(montoDecimal)) {
        const error = new Error('Saldo insuficiente') as Error & { statusCode: number }
        error.statusCode = 400
        throw error
      }

      // Determinar si la transacción debe ser automática o pendiente
      const esAutomatica = montoDecimal.lte(LIMITE_AUTO_APROBACION)
      const estado = esAutomatica ? 'CONFIRMADA' : 'PENDIENTE'

      // Crear la transacción
      const transaccion = await tx.transaction.create({
        data: {
          origenId,
          destinoId,
          monto: montoDecimal,
          estado
        },
        include: {
          origen: {
            select: { id: true, email: true, nombre: true, saldo: true }
          },
          destino: {
            select: { id: true, email: true, nombre: true, saldo: true }
          }
        }
      })

      // Si es automática, procesar los saldos inmediatamente
      if (esAutomatica) {
        const nuevoSaldoOrigen = usuarioOrigen.saldo.minus(montoDecimal)
        const nuevoSaldoDestino = usuarioDestino.saldo.plus(montoDecimal)

        // Actualizar saldos
        await tx.user.update({
          where: { id: origenId },
          data: { saldo: nuevoSaldoOrigen }
        })

        await tx.user.update({
          where: { id: destinoId },
          data: { saldo: nuevoSaldoDestino }
        })
      }

      return transaccion
    }, {
      isolationLevel: 'Serializable'
    })

    return result
  }

  /**
   * Actualizar el estado de una transacción
   * @param transactionId - ID de la transacción
   * @param nuevoEstado - Nuevo estado (CONFIRMADA o RECHAZADA)
   * @param adminUserId - ID del usuario administrador
   * @returns Transacción actualizada
   */
  async updateTransactionStatus(transactionId: string, nuevoEstado: 'CONFIRMADA' | 'RECHAZADA', adminUserId: string): Promise<TransactionWithUsers> {
    // Usar transacción de base de datos para atomicidad
    const result = await prisma.$transaction(async (tx) => {
      // Buscar la transacción
      const transaccion = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          origen: {
            select: { id: true, email: true, nombre: true, saldo: true }
          },
          destino: {
            select: { id: true, email: true, nombre: true, saldo: true }
          }
        }
      })

      if (!transaccion) {
        const error = new Error('Transacción no encontrada') as Error & { statusCode: number }
        error.statusCode = 404
        throw error
      }

      // Solo se pueden modificar transacciones pendientes
      if (transaccion.estado !== 'PENDIENTE') {
        const error = new Error('Solo se pueden modificar transacciones pendientes') as Error & { statusCode: number }
        error.statusCode = 400
        throw error
      }

      // Actualizar el estado de la transacción
      const transaccionActualizada = await tx.transaction.update({
        where: { id: transactionId },
        data: { estado: nuevoEstado },
        include: {
          origen: {
            select: { id: true, email: true, nombre: true, saldo: true }
          },
          destino: {
            select: { id: true, email: true, nombre: true, saldo: true }
          }
        }
      })

      // Si se aprueba, procesar los saldos
      if (nuevoEstado === 'CONFIRMADA') {
        const monto = transaccion.monto
        const nuevoSaldoOrigen = transaccion.origen.saldo.minus(monto)
        const nuevoSaldoDestino = transaccion.destino.saldo.plus(monto)

        // Verificar que el origen tenga saldo suficiente al momento de aprobar
        if (nuevoSaldoOrigen.lt(0)) {
          const error = new Error('Saldo insuficiente para procesar la transacción') as Error & { statusCode: number }
          error.statusCode = 400
          throw error
        }

        // Actualizar saldos
        await tx.user.update({
          where: { id: transaccion.origenId },
          data: { saldo: nuevoSaldoOrigen }
        })

        await tx.user.update({
          where: { id: transaccion.destinoId },
          data: { saldo: nuevoSaldoDestino }
        })
      }

      return transaccionActualizada
    }, {
      isolationLevel: 'Serializable'
    })

    return result
  }

  /**
   * Obtener todas las transacciones de un usuario (endpoint administrativo)
   * @param targetUserId - ID del usuario objetivo
   * @param options - Opciones de consulta (paginación, filtros)
   * @returns Lista de transacciones con paginación
   */
  async getAllUserTransactions(targetUserId: string, options: TransactionListOptions = {}): Promise<TransactionListResult> {
    const {
      page = 1,
      limit = 10,
      estado,
      fechaDesde,
      fechaHasta
    } = options

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      OR: [
        { origenId: targetUserId },
        { destinoId: targetUserId }
      ]
    }

    if (estado) {
      where.estado = estado
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = fechaDesde
      if (fechaHasta) where.fecha.lte = fechaHasta
    }

    // Obtener transacciones con paginación
    const [transacciones, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          origen: {
            select: { id: true, email: true, nombre: true }
          },
          destino: {
            select: { id: true, email: true, nombre: true }
          }
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    // Agregar tipo de transacción (ENVIADA o RECIBIDA)
    const transaccionesConTipo = transacciones.map(transaccion => ({
      ...transaccion,
      tipo: transaccion.origenId === targetUserId ? 'ENVIADA' as const : 'RECIBIDA' as const,
      monto: parseFloat(transaccion.monto.toString())
    }))

    const totalPages = Math.ceil(total / limit)

    return {
      transacciones: transaccionesConTipo,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }
}

export default new TransactionService()
