# Challenge Belo API

## 🚀 Características

- ✅ Autenticación segura con JWT
- ✅ Validación de datos con Zod
- ✅ Hash seguro de contraseñas con bcrypt
- ✅ Rate limiting para prevenir ataques
- ✅ Headers de seguridad con Helmet
- ✅ CORS configurado
- ✅ Documentación automática con Swagger
- ✅ Tests unitarios completos
- ✅ Manejo de errores robusto
- ✅ Base de datos con Prisma ORM
- ✅ Sistema de transacciones con validaciones de negocio

## 📋 Requisitos

- Node.js >= 18
- PostgreSQL >= 12
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/JoaquinGiorgis/challenge-belo
cd challenge-belo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env
```

Editar `.env` con tus configuraciones:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/challenge_belo_db"
JWT_SECRET="tu_jwt_secret"
PORT=3000
NODE_ENV=development
```

4. **Configurar base de datos**
```bash
# Crear base de datos
createdb challenge_belo_db

# Generar cliente Prisma
npm run prisma:generate

# Aplicar migraciones
npm run db:push
```

## 🏃‍♂️ Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Tests
```bash
npm test
```

## 📚 Documentación de la API

Una vez que el servidor esté corriendo, puedes acceder a:

- **Documentación Swagger**: http://localhost:3000/docs

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo con nodemon
- `npm test` - Ejecutar tests unitarios
- `npm run test:watch` - Ejecutar tests en modo watch
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run db:push` - Sincronizar esquema con la base de datos
- `npm run db:reset` - Resetear base de datos

## 🏗️ Estructura del Proyecto

```
src/
├── config/          # Configuración de base de datos y variables de entorno
├── controllers/     # Controladores de las rutas
├── middleware/      # Middleware de autenticación
├── routes/          # Definición de rutas
├── schemas/         # Esquemas de validación con Zod
├── services/        # Lógica de negocio
├── test/           # Tests unitarios
└── server.ts      # Punto de entrada de la aplicación
```

## 🔐 Endpoints Principales

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/transactions` - Crear transacción
- `GET /api/transactions` - Listar transacciones del usuario
- `PATCH /api/transactions/:id/approve` - Aprobar transacción pendiente
- `PATCH /api/transactions/:id/reject` - Rechazar transacción pendiente

> **📖 Para ver la documentación completa de la API, incluyendo ejemplos de request/response, visita http://localhost:3000/docs**
