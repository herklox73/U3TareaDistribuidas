# Portal de compras — Flujo distribuido seguro con autenticacion, roles y registro de eventos

## Nombre del estudiante
Carlos Vicente Calapucha Ñacata

## Nombre del proyecto
Portal de compras — autenticacion con Google, roles, compras transaccionales y registro de eventos

## Descripcion de la solucion
Aplicacion distribuida compuesta por un backend (Node.js + Express) y un cliente web (React + Vite) que permite
a un cliente autenticado con Google comprar uno o varios productos, y a un administrador gestionar el catalogo,
el stock y consultar las ordenes registradas. El acceso se controla mediante JWT propio, con roles obtenidos desde
la base de datos (nunca desde el cliente), revocacion real de tokens al cerrar sesion, manejo centralizado de
errores con formato uniforme, y registro de eventos del sistema en UTC mediante un patron Observer.

## Stack tecnologico
- Backend: Node.js + Express
- Frontend: React 18 + Vite
- Base de datos: PostgreSQL (esquema Northwind, extendido)
- Autenticacion: Google OAuth 2.0 (Passport.js) + JWT (jsonwebtoken)
- Logs: Winston (formato de linea UTC)
- Patron de diseno aplicado: Observer (EventEmitter nativo de Node.js)

## Base de datos
PostgreSQL, esquema Northwind con las siguientes tablas adicionales del sistema:
- `users` (incluye columna `role`: admin | customer)
- `revoked_tokens` (estrategia de revocacion de JWT por `jti`)
- `system_logs` (persistencia de eventos del sistema)
- `purchase_orders` (encabezado de la orden de compra)
- `purchase_order_details` (detalle de la orden, incluye `subtotal`)

## Requisitos previos
- Node.js 18 o superior
- PostgreSQL 14 o superior
- Una cuenta de Google Cloud con credenciales OAuth 2.0 (Client ID y Client Secret)

## Estructura general del proyecto

```
U3TareaDistribuidas/
├── backend/
│   └── src/
│       ├── config/          (conexion a BD, logger)
│       ├── routes/          (definicion de endpoints y autenticacion Google)
│       ├── middlewares/     (auth, roles, errores, logging de requests)
│       ├── controllers/     (manejo de peticion/respuesta HTTP)
│       ├── services/        (reglas de negocio y validaciones)
│       ├── repositories/    (acceso a datos - SQL)
│       └── events/          (patron Observer: emisor y subscriptor de logs)
├── frontend/
│   └── src/
│       ├── pages/           (LoginPage, AuthCallback, CustomerDashboard, AdminDashboard)
│       ├── components/      (Navbar, Pagination, ConfirmModal, ProtectedRoute)
│       ├── context/         (AuthContext - decodifica y comparte el JWT)
│       └── services/        (cliente HTTP hacia el backend)
├── database/
│   └── migration_roles_orders.sql
├── Northwind_CalapuchaCarlos.sql
├── .env.example
└── README.md
```

## Configuracion de la base de datos
1. Crear una base de datos PostgreSQL (por ejemplo `northwind`).
2. Restaurar el esquema base Northwind desde `Northwind_CalapuchaCarlos.sql`.
3. Ejecutar `database/migration_roles_orders.sql` para agregar roles, ordenes con subtotal y las
   restricciones necesarias.

## Configuracion de Google OAuth
1. Crear un proyecto en Google Cloud Console.
2. Habilitar la pantalla de consentimiento OAuth.
3. Crear credenciales OAuth 2.0 de tipo "Aplicacion web".
4. Registrar como URI de redireccion autorizado: `http://localhost:3001/auth/google/callback`.
5. Copiar el Client ID y el Client Secret al archivo `.env` del backend.

## Variables de entorno
Ver `.env.example` en la raiz del proyecto. El archivo `.env` real nunca debe subirse al repositorio
(esta excluido mediante `.gitignore`).

## Instrucciones de instalacion y ejecucion

### 1. Backend
```
cd backend
cp ../.env.example .env   # completar con los valores reales
npm install
npm run dev
```
Backend disponible en: `http://localhost:3001`

### 2. Frontend
```
cd frontend
npm install
npm run dev
```
Cliente web disponible en: `http://localhost:5173`

## Roles implementados
- **admin**: consulta y busca productos (activos e inactivos), crea y actualiza productos, ajusta stock,
  desactiva/reactiva productos, consulta todas las ordenes y sus detalles, accede al registro de eventos.
- **customer**: consulta y busca productos activos, realiza compras de uno o varios productos, consulta
  unicamente sus propias ordenes.

El rol se asigna en la base de datos y viaja dentro del JWT; nunca se confia en un rol enviado por el cliente.

## Instrucciones para probar el flujo
1. Ingresar a `http://localhost:5173` y autenticarse con Google.
2. Si el usuario es `customer`: navegar el catalogo, agregar productos al carrito, confirmar la compra y
   revisar el resultado en la pestaña "Mis compras".
3. Si el usuario es `admin`: gestionar productos (crear, editar, desactivar/reactivar) y revisar el listado
   de ordenes con su detalle.
4. Cerrar sesion y verificar que el token anterior queda revocado (una peticion posterior con ese token
   responde `401` con el error `TOKEN_REVOCADO`).

## Coleccion de Postman
Disponible en `postman/coleccion.postman_collection.json`. Incluye los casos: login, compra exitosa,
acceso sin token (401), acceso con rol no autorizado (403), token vencido, token revocado reutilizado,
y operaciones administrativas.
