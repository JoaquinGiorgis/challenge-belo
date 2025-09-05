import { beforeAll, afterAll, beforeEach } from '@jest/globals'

// Mock de Prisma para tests
const prisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  transaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn()
} as any

// Mock del módulo de Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prisma)
}))


beforeAll(async () => {
})

beforeEach(async () => {
  // Limpiar mocks antes de cada test
  jest.clearAllMocks()
})

afterAll(async () => {
})

// Exportar prisma mock para usar en los tests
export { prisma }
