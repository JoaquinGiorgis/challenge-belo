import { z } from 'zod'

// Schema para registro de usuario
export const registerSchema = z.object({
  email: z.string()
    .email('Email debe tener un formato válido')
    .min(1, 'Email es requerido'),
  nombre: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .trim(),
  password: z.string()
    .min(7, 'Password debe tener más de 6 caracteres')
    .max(100, 'Password no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-z])/, 'Password debe contener al menos una letra minúscula')
    .regex(/^(?=.*[A-Z])/, 'Password debe contener al menos una letra mayúscula')
    .regex(/^(?=.*\d)/, 'Password debe contener al menos un número')
    .regex(/^(?=.*[@$!%*?&])/, 'Password debe contener al menos un carácter especial (@$!%*?&)')
})

// Schema para login
export const loginSchema = z.object({
  email: z.string()
    .email('Email debe tener un formato válido')
    .min(1, 'Email es requerido'),
  password: z.string()
    .min(1, 'Password es requerido')
})

// Schema para respuesta de usuario (sin password)
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombre: z.string(),
  saldo: z.number().transform(val => parseFloat(val.toString())),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Tipos TypeScript derivados de los schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
