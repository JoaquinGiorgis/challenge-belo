import { z } from 'zod'

// Schema para crear una transacción
export const createTransactionSchema = z.object({
  destinoId: z.string().min(1, 'ID de destino es requerido'),
  monto: z.number()
    .positive('El monto debe ser un número positivo')
    .max(10000000000000.00, 'El monto excede el límite máximo') // Max 15 digits total, 2 decimal
    .refine(val => {
      const decimalPlaces = (val.toString().split('.')[1] || '').length
      return decimalPlaces <= 2
    }, 'El monto no puede tener más de 2 decimales')
})

// Schema para consultar transacciones administrativas
export const adminTransactionQuerySchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  estado: z.enum(['PENDIENTE', 'CONFIRMADA', 'RECHAZADA']).optional(),
  fechaDesde: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  fechaHasta: z.string().optional().transform((val) => val ? new Date(val) : undefined)
})

// Tipos TypeScript derivados de los schemas
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type AdminTransactionQuery = z.infer<typeof adminTransactionQuerySchema>
