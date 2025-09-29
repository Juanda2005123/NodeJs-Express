# 🏢 API de Gestión Inmobiliaria - Taller Backend NodeJS

<div align="center">
  
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotj## #### ⚙️ Gestión Administrativa
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|--------|
| `POST` | `/users` | Crea nuevo usuario | `superadmin` |
| `GET` | `/users` | Lista todos los usuarios | `superadmin` |
| `GET` | `/users/:id` | Obtiene usuario por ID | `superadmin` |
| `PUT` | `/users/:id` | Actualiza usuario por ID | `superadmin` |
| `DELETE` | `/users/:id` | Elimina usuario por ID* | `superadmin` |

*Solo si no tiene propiedades asignadas

---

### 2️⃣ Módulo de Propiedades 🏠

#### � Consultas Públicas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/properties` | Lista todas las propiedades |
| `GET` | `/properties/:id` | Obtiene propiedad por ID |

#### 🏡 Gestión de Agente
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|--------|
| `POST` | `/properties/agent` | Crea nueva propiedad | `agente` |
| `PUT` | `/properties/agent/:id` | Actualiza su propiedad | `agente` |
| `DELETE` | `/properties/agent/:id` | Elimina su propiedad** | `agente` |

#### ⚙️ Gestión Administrativa
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|--------|
| `POST` | `/properties/admin` | Crea propiedad (cualquier owner) | `superadmin` |
| `PUT` | `/properties/admin/:id` | Actualiza cualquier propiedad | `superadmin` |
| `DELETE` | `/properties/admin/:id` | Elimina cualquier propiedad** | `superadmin` |

**Elimina automáticamente todas las tareas asociadas

---

### 3️⃣ Módulo de Tareas �� 

#### 👤 Gestión de Agente
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|--------|
| `GET` | `/tasks/agent` | Lista sus tareas asignadas | `agente` |
| `GET` | `/tasks/agent/:id` | Obtiene su tarea por ID | `agente` |
| `GET` | `/tasks/property/:propertyId` | Tareas de su propiedad | `agente` |
| `POST` | `/tasks/agent` | Crea tarea en su propiedad | `agente` |
| `PUT` | `/tasks/agent/:id` | Actualiza su tarea | `agente` |
| `DELETE` | `/tasks/agent/:id` | Elimina su tarea | `agente` |

#### ⚙️ Gestión Administrativa
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|--------|
| `GET` | `/tasks/admin` | Lista todas las tareas | `superadmin` |
| `GET` | `/tasks/admin/:id` | Obtiene cualquier tarea | `superadmin` |
| `GET` | `/tasks/admin/property/:propertyId` | Tareas de cualquier propiedad | `superadmin` |
| `POST` | `/tasks/admin` | Crea tarea en cualquier propiedad | `superadmin` |
| `PUT` | `/tasks/admin/:id` | Actualiza cualquier tarea | `superadmin` |
| `DELETE` | `/tasks/admin/:id` | Elimina cualquier tarea | `superadmin` |**Pruebas de Integración (Postman)**
📁 **Colección disponible:** `Inmobiliaria Express - NodeJS.postman_collection.json`

#### 🎯 Cómo realizar las pruebas:

1. **📋 Importa la colección** de Postman en tu workspace
2. **🗄️ Inicia la base de datos** con `docker-compose up -d`
3. **🌱 Puebla con datos iniciales** ejecutando `bun run db:seed`
4. **🚀 Inicia la aplicación** con `bun run dev`
5. **📂 Abre los folders** en la colección por módulo
6. **▶️ Ejecuta las pruebas** de manera secuencial

#### 🔧 **Variables de Entorno:**
- `{{jwt_token}}` - Token de autenticación de agente
- `{{jwt_SuperToken}}` - Token de autenticación de superadmin
- `{{test_agent_id}}` - ID del agente de prueba
- `{{base_url}}` - URL base de la API

### 🧪 **Pruebas Unitarias**
> 🚧 **Estado:** Pendiente de implementación

**Objetivo:** Cobertura del 80% usando Jest
- **Componentes a probar:** Controladores, servicios, modelos, utilidades
- **Escenarios:** Casos de éxito y error, validaciones, lógica de negocio
- **Frameworks:** Jest para testing, Supertest para APIs)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

**Una API RESTful robusta para la gestión de una agencia inmobiliaria**

*Desarrollada como parte del taller "Backend - NodeJS" de la materia Computación en Internet III*

</div>

---

## 📋 Tabla de Contenidos

- [🎯 Descripción del Proyecto](#-descripción-del-proyecto)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [📋 Prerrequisitos](#-prerrequisitos)
- [⚡ Instalación y Configuración](#-instalación-y-configuración)
- [🚀 Ejecución del Proyecto](#-ejecución-del-proyecto)
- [📡 Uso de la API (Endpoints)](#-uso-de-la-api-endpoints)
- [🧪 Pruebas con Postman](#-pruebas-con-postman)
- [☁️ Despliegue](#️-despliegue)
- [📈 Roadmap del Proyecto](#-roadmap-del-proyecto)

---

## 🎯 Descripción del Proyecto

API backend completa para una herramienta interna de una agencia inmobiliaria desarrollada como parte del taller "Backend - NodeJS" de Computación en Internet III. La aplicación implementa un sistema robusto de gestión de usuarios, propiedades y tareas con autenticación JWT, roles diferenciados y integridad referencial.

### ✨ Funcionalidades Implementadas

- **👥 Gestión de Usuarios:** Sistema completo de CRUD con roles y autenticación JWT
- **🔐 Autenticación y Autorización:** Seguridad basada en JSON Web Tokens con middleware de roles
- **🛡️ Roles y Permisos:** Dos niveles de acceso diferenciados:
  - `superadmin`: Control total sobre todos los módulos (usuarios, propiedades, tareas)
  - `agente`: Gestión de sus propias propiedades y tareas asignadas
- **🏠 Gestión de Propiedades:** CRUD completo con ownership y control de acceso por roles
- **📝 Gestión de Tareas:** CRUD completo vinculado a propiedades con asignación automática
- **🔄 Integridad Referencial:** Cascade delete y validación de dependencias
- **⚡ Optimizaciones:** Filtros combinados en MongoDB y centralización de errores

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología |
|-----------|------------|
| **Runtime** | Node.js, Bun |
| **Framework** | Express.js |
| **Lenguaje** | TypeScript |
| **Base de Datos** | MongoDB (Docker) |
| **ODM** | Mongoose |
| **Seguridad** | JWT, bcrypt |
| **Contenedores** | Docker Compose |
| **Arquitectura** | DTOs, Serializers, Middleware |
| **Patrones** | Repository, Service Layer, Error Handling |

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas:

- ✅ **Node.js:** v20.x o superior (`node -v`)
- ✅ **Bun:** v1.x o superior (`bun -v`)
- ✅ **Docker & Docker Compose:** Asegúrate de que Docker Desktop esté en ejecución
  - `docker --version`
  - `docker-compose --version`
- ✅ **Git:** Para clonar el repositorio

---

## ⚡ Instalación y Configuración

### 1️⃣ Instalar Dependencias

```bash
bun install
```

### 2️⃣ Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Puerto de la aplicación
PORT=3000

# Credenciales y URI de la Base de Datos MongoDB (datos de ejemplo)
MONGO_USER=admin
MONGO_PASSWORD=admin123
MONGO_URI=mongodb://admin:admin123@localhost:27017/inmobiliariaDB?authSource=admin

# Secreto para firmar los JSON Web Tokens
JWT_SECRET=clave_007
```

---

## 🚀 Ejecución del Proyecto

### 🗄️ Iniciar la Base de Datos

```bash
docker-compose up -d
```

> 💡 **Tip:** Verifica que el contenedor esté corriendo con `docker ps`

### 🌱 Sembrar la Base de Datos (Primera vez)

```bash
bun run db:seed
```

### 🔥 Iniciar la Aplicación

```bash
bun run dev
```

✅ **¡Listo!** El servidor estará corriendo en `http://localhost:3000`

---

## 📡 Uso de la API (Endpoints)

> **Base URL:** `http://localhost:3000/api`

### 1️⃣ Módulo de Usuarios �

#### �🔓 Autenticación Pública
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/users/register` | Registra un nuevo usuario (rol: `agente`) |
| `POST` | `/users/login` | Autentica usuario y devuelve JWT |

#### 👤 Perfil Personal
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/users/me` | Obtiene perfil del usuario actual | ✅ |
| `PUT` | `/users/me` | Actualiza perfil del usuario actual | ✅ |
| `DELETE` | `/users/me` | Elimina cuenta del usuario actual | ✅ |

#### �️ Gestión Administrativa
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|--------|
| `POST` | `/users` | Crea nuevo usuario | `superadmin` |
| `GET` | `/users` | Lista todos los usuarios | `superadmin` |
| `GET` | `/users/:id` | Obtiene usuario por ID | `superadmin` |
| `PUT` | `/users/:id` | Actualiza usuario por ID | `superadmin` |
| `DELETE` | `/users/:id` | Elimina usuario por ID | `superadmin` |

---

### 2️⃣ Módulo de Propiedades 🏠 

> 🚧 **Estado:** En desarrollo

---

### 3️⃣ Módulo de Tareas 📋

> 🚧 **Estado:** En desarrollo

---

## 🧪 Pruebas con Postman

📁 **Colección disponible:** `Inmobiliaria Express - NodeJS.postman_collection.json`

### 🎯 Cómo realizar las pruebas:

1. **📋 Importa la colección** de Postman en tu workspace
2. **🗄️ Inicia la base de datos** con `docker-compose up -d`
3. **🌱 Puebla con datos iniciales** ejecutando `bun run db:seed`
4. **🚀 Inicia la aplicación** con `bun run dev`
5. **📂 Abre los folders** en la colección
6. **▶️ Ejecuta las pruebas** de arriba hacia abajo en orden secuencial

> � **Tip:** Las pruebas están organizadas en folders por módulo. Ejecuta cada folder de manera secuencial para obtener mejores resultados.
- `{{jwt_token}}` - Token de autenticación
- `{{jwt_SuperToken}}` - Token de autenticación de super usuario
- `{{test_agent_id}}` - ID del agente de prueba

---

## 🏗️ Arquitectura y Características Técnicas

### 📊 **Patrones Implementados**
- **DTO (Data Transfer Objects):** Validación y serialización de datos
- **Service Layer:** Lógica de negocio separada de controladores
- **Repository Pattern:** Abstracción de acceso a datos
- **Middleware Chain:** Autenticación, autorización y manejo de errores

### 🔄 **Integridad Referencial**
- **Cascade Delete:** Eliminar propiedad → elimina tareas automáticamente
- **Dependency Validation:** No permite eliminar usuarios con propiedades
- **Ownership Control:** Agentes solo gestionan sus recursos

### ⚡ **Optimizaciones**
- **Filtros Combinados:** Consultas MongoDB optimizadas
- **Error Handler Centralizado:** Manejo unificado de errores
- **Populate Strategy:** Carga eficiente de relaciones

### 🛡️ **Seguridad**
- **JWT Authentication:** Tokens seguros con expiración
- **Role-based Authorization:** Permisos diferenciados
- **Password Hashing:** bcrypt con salt
- **Input Validation:** Validación de entrada en todos los endpoints

---

## ☁️ Despliegue

> 🚧 **Estado:** Pendiente de implementación

🌐 **API Desplegada:** [Próximamente]

---

## 📈 Estado del Proyecto

### ✅ **Módulos Completados**

#### 👥 **Módulo de Usuarios**
- [x] Autenticación JWT completa (Login/Register)
- [x] Middlewares de autorización por roles
- [x] CRUD completo con rutas protegidas
- [x] Validación de dependencias para eliminación
- [x] Serialización segura de datos

#### 🏠 **Módulo de Propiedades**
- [x] Modelo completo con relaciones
- [x] CRUD diferenciado por roles (agente/superadmin)
- [x] Ownership y control de acceso
- [x] Cascade delete de tareas asociadas
- [x] Rutas públicas y privadas

#### 📋 **Módulo de Tareas**
- [x] Sistema completo de tareas vinculadas a propiedades
- [x] Asignación automática basada en ownership
- [x] CRUD diferenciado por roles
- [x] Integridad referencial con propiedades
- [x] Optimizaciones con filtros combinados

### � **Pendientes de Implementación**
- [ ] **Pruebas Unitarias:** Cobertura del 80% con Jest
- [ ] **Despliegue en Nube:** Implementación en plataforma cloud
- [ ] **Colección Postman:** Pruebas de integración completas
- [ ] **Documentación Adicional:** Diagramas de arquitectura

---

## 📚 Cumplimiento de Requisitos

### ✅ **Requisitos Funcionales Implementados**

#### 👥 **Gestión de Usuarios**
- [x] Superadmin puede crear, modificar y eliminar usuarios
- [x] Roles implementados: `superadmin`, `agente` (usuario regular)
- [x] Usuarios autenticados pueden ver/editar su perfil
- [x] Solo superadmin puede gestionar otros usuarios

#### 🔐 **Autenticación y Autorización**
- [x] Sistema JWT completo con middleware de autenticación
- [x] Middleware de validación de roles para cada operación
- [x] Rutas protegidas según permisos de usuario

#### 🏠📋 **Módulos Interrelacionados**
- [x] **Módulo Propiedades:** CRUD completo con ownership
- [x] **Módulo Tareas:** CRUD vinculado a propiedades
- [x] Relación directa entre propiedades y tareas
- [x] Gestión diferenciada por roles (agente vs superadmin)

#### 🔄 **Características Adicionales**
- [x] Integridad referencial (cascade delete, validación dependencias)
- [x] Optimizaciones de rendimiento (filtros combinados)
- [x] Error handling centralizado
- [x] Arquitectura escalable con DTOs y Services

### 🚧 **Elementos Pendientes**
- [ ] **Pruebas Unitarias:** 80% cobertura con Jest
- [ ] **Pruebas Integración:** Colección Postman completa
- [ ] **Despliegue:** Implementación en nube
- [ ] **Documentación:** README técnico detallado

---

<div align="center">

<p><strong>Desarrollado para Computación en Internet III - Universidad Icesi</strong></p>
<p><em>Taller: Backend NodeJS - Docente: Kevin Rodriguez</em></p>
<p><em>Entrega: Septiembre 2025</em></p>

</div>
  
