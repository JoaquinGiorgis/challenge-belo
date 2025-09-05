import dotenv from 'dotenv'
import { z } from 'zod'

// Cargar variables de entorno
dotenv.config()

// Esquema de validación para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
})

// Tipo para las variables de entorno
export type EnvConfig = z.infer<typeof envSchema>

// Validar y exportar configuración
let env: EnvConfig

try {
  env = envSchema.parse(process.env)
} catch (error) {
  console.error('❌ Variables de entorno inválidas:')
  if (error instanceof z.ZodError) {
    console.error(error.format())
  } else {
    console.error(error)
  }
  process.exit(1)
}

export default env
