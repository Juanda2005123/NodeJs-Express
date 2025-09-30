# 🏢 API de Gestión Inmobiliaria - Taller Backend NodeJS

<div align="center">
  
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

**Una API RESTful robusta para la gestión de una agencia inmobiliaria**

_Desarrollada como parte del taller "Backend - NodeJS" de la materia Computación en Internet III_

</div>

---

## 📋 Tabla de Contenidos

- [🎯 Descripción del Proyecto](#-descripción-del-proyecto)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [📋 Prerrequisitos](#-prerrequisitos)
- [⚡ Instalación y Configuración](#-instalación-y-configuración)
- [🚀 Ejecución del Proyecto](#-ejecución-del-proyecto)
- [📡 Uso de la API (Endpoints)](#-uso-de-la-api-endpoints)
- [🧪 Pruebas](#-pruebas)
- [🏗️ Arquitectura y Características Técnicas](#️-arquitectura-y-características-técnicas)
- [☁️ Despliegue](#️-despliegue)
- [📈 Estado del Proyecto](#-estado-del-proyecto)
- [📚 Cumplimiento de Requisitos](#-cumplimiento-de-requisitos)

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

| Categoría         | Tecnología                                     |
| ----------------- | ---------------------------------------------- |
| **Runtime**       | Node.js, Bun                                   |
| **Framework**     | Express.js                                     |
| **Lenguaje**      | TypeScript                                     |
| **Base de Datos** | MongoDB (Docker)                               |
| **ODM**           | Mongoose                                       |
| **Seguridad**     | JWT, bcrypt                                    |
| **Contenedores**  | Docker Compose                                 |
| **Arquitectura**  | DTOs, Serializers, Service Layer, Middleware   |
| **Patrones**      | MVC, Service Layer, Centralized Error Handling |

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

### 1️⃣ Módulo de Usuarios 👥

#### 🔓 Autenticación Pública

| Método | Endpoint          | Descripción                               |
| ------ | ----------------- | ----------------------------------------- |
| `POST` | `/users/register` | Registra un nuevo usuario (rol: `agente`) |
| `POST` | `/users/login`    | Autentica usuario y devuelve JWT          |

#### 👤 Perfil Personal

| Método   | Endpoint    | Descripción                         | Auth |
| -------- | ----------- | ----------------------------------- | ---- |
| `GET`    | `/users/me` | Obtiene perfil del usuario actual   | ✅   |
| `PUT`    | `/users/me` | Actualiza perfil del usuario actual | ✅   |
| `DELETE` | `/users/me` | Elimina cuenta del usuario actual\* | ✅   |

#### ⚙️ Gestión Administrativa

| Método   | Endpoint     | Descripción              | Roles        |
| -------- | ------------ | ------------------------ | ------------ |
| `POST`   | `/users`     | Crea nuevo usuario       | `superadmin` |
| `GET`    | `/users`     | Lista todos los usuarios | `superadmin` |
| `GET`    | `/users/:id` | Obtiene usuario por ID   | `superadmin` |
| `PUT`    | `/users/:id` | Actualiza usuario por ID | `superadmin` |
| `DELETE` | `/users/:id` | Elimina usuario por ID\* | `superadmin` |

\*Solo si no tiene propiedades asignadas

---

### 2️⃣ Módulo de Propiedades 🏠

#### 🔓 Consultas Públicas

| Método | Endpoint          | Descripción                 |
| ------ | ----------------- | --------------------------- |
| `GET`  | `/properties`     | Lista todas las propiedades |
| `GET`  | `/properties/:id` | Obtiene propiedad por ID    |

#### 🏡 Gestión de Agente

| Método   | Endpoint                | Descripción              | Roles    |
| -------- | ----------------------- | ------------------------ | -------- |
| `POST`   | `/properties/agent`     | Crea nueva propiedad     | `agente` |
| `PUT`    | `/properties/agent/:id` | Actualiza su propiedad   | `agente` |
| `DELETE` | `/properties/agent/:id` | Elimina su propiedad\*\* | `agente` |

#### ⚙️ Gestión Administrativa

| Método   | Endpoint                | Descripción                      | Roles        |
| -------- | ----------------------- | -------------------------------- | ------------ |
| `POST`   | `/properties/admin`     | Crea propiedad (cualquier owner) | `superadmin` |
| `PUT`    | `/properties/admin/:id` | Actualiza cualquier propiedad    | `superadmin` |
| `DELETE` | `/properties/admin/:id` | Elimina cualquier propiedad\*\*  | `superadmin` |

\*\*Elimina automáticamente todas las tareas asociadas

---

### 3️⃣ Módulo de Tareas 📋

#### 👤 Gestión de Agente

| Método   | Endpoint                      | Descripción                | Roles    |
| -------- | ----------------------------- | -------------------------- | -------- |
| `GET`    | `/tasks/agent`                | Lista sus tareas asignadas | `agente` |
| `GET`    | `/tasks/agent/:id`            | Obtiene su tarea por ID    | `agente` |
| `GET`    | `/tasks/property/:propertyId` | Tareas de su propiedad     | `agente` |
| `POST`   | `/tasks/agent`                | Crea tarea en su propiedad | `agente` |
| `PUT`    | `/tasks/agent/:id`            | Actualiza su tarea         | `agente` |
| `DELETE` | `/tasks/agent/:id`            | Elimina su tarea           | `agente` |

#### ⚙️ Gestión Administrativa

| Método   | Endpoint                            | Descripción                       | Roles        |
| -------- | ----------------------------------- | --------------------------------- | ------------ |
| `GET`    | `/tasks/admin`                      | Lista todas las tareas            | `superadmin` |
| `GET`    | `/tasks/admin/:id`                  | Obtiene cualquier tarea           | `superadmin` |
| `GET`    | `/tasks/admin/property/:propertyId` | Tareas de cualquier propiedad     | `superadmin` |
| `POST`   | `/tasks/admin`                      | Crea tarea en cualquier propiedad | `superadmin` |
| `PUT`    | `/tasks/admin/:id`                  | Actualiza cualquier tarea         | `superadmin` |
| `DELETE` | `/tasks/admin/:id`                  | Elimina cualquier tarea           | `superadmin` |

---

## 🧪 Pruebas

### 📋 **Pruebas de Integración (Postman)**

📁 **Colección disponible:** `Inmobiliaria Express CompleteTest- NodeJS.postman_collection.json`

#### 🎯 Cómo realizar las pruebas:

1. **📋 Importa la colección** de Postman en tu workspace
2. **🗄️ Inicia la base de datos** con `docker-compose up -d`
3. **🌱 Puebla con datos iniciales** ejecutando `bun run db:seed`
4. **🚀 Inicia la aplicación** con `bun run dev`
5. **📂 Abre los folders** en la colección por módulo (Users, Properties, Tasks)
6. **▶️ Ejecuta las pruebas** de manera secuencial (importante, ya que algunas dependen de IDs creados previamente)

#### 🔧 **Variables de Entorno:**

- {{base_url}} → URL base de la API (http://localhost:3000)

- {{jwt_token}} → Token de autenticación de agente

- {{jwt_SuperToken}} → Token de autenticación de superadmin

- {{test_agent_id}} → ID del agente de prueba

- {{test_property_id}} → ID de la propiedad de prueba

- {{second_test_property_id}} → ID de segunda propiedad de prueba

- {{test_property_owner_id}} → ID del owner de la propiedad de prueba

- {{second_test_property_owner_id}} → ID del owner de la segunda propiedad

- {{test_task_id}} → ID de la tarea de prueba

### 🧪 **Pruebas Unitarias**

✅ **Estado:** ✨ **IMPLEMENTADO** - Cobertura del 90.75%

#### 📊 Resultados de Cobertura

| Métrica | Porcentaje | Estado |
|---------|-----------|--------|
| **Statements** | 90.75% | ✅ |
| **Branches** | 88.17% | ✅ |
| **Functions** | **100%** | 🎯 |
| **Lines** | 89.69% | ✅ |

#### 🎯 Distribución de Tests

- **260 tests totales** pasando ✅
- **11 test suites** completos
- **Tiempo de ejecución:** ~74 segundos

**Cobertura por Componente:**
- 🎮 **Controllers:** 88.55% (119 tests)
  - User Controller: 40 tests
  - Property Controller: 32 tests
  - Task Controller: 47 tests
- ⚙️ **Services:** 91.5% (75 tests)
  - User, Property, Task Services
- 🛡️ **Middlewares:** 100% (cobertura completa)
  - Authentication & Authorization
  - Error Handler
- 🔧 **Utils:** 100% (9 tests)
  - Serializers (User, Property, Task)

#### 🚀 Ejecutar las Pruebas

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con cobertura
npm run test:coverage
```
#### 📁 Documentación Completa

📄 **Ver reporte detallado:** [`docs/testCoverage/coverage.md`](./docs/testCoverage/coverage.md)

📊 **Reporte HTML interactivo:** `docs/testCoverage/report/fullReport.html`
---

## 🏗️ Arquitectura y Características Técnicas

### 📊 **Patrones Implementados**

- **DTO (Data Transfer Objects):** Validación y serialización de datos de entrada
- **Service Layer:** Lógica de negocio centralizada que interactúa directamente con modelos Mongoose
- **Serializers:** Formateo y transformación de datos de salida
- **Middleware Chain:** Autenticación, autorización y manejo centralizado de errores

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

### 🌐 **API Desplegada en Render**

🚀 **URL Base:** [https://inmobiliaria-api-58kh.onrender.com](https://inmobiliaria-api-58kh.onrender.com)

---

## 📈 Estado del Proyecto

### ✅ **Módulos Completados**

#### 👥 **Módulo de Usuarios**

- [x] Autenticación JWT completa (Login/Register)
- [x] Middlewares de autorización por roles
- [x] CRUD completo con rutas protegidas
- [x] Validación de dependencias para eliminación
- [x] Serialización segura de datos
- [x] **Tests:** 40 tests unitarios e integración
      

#### 🏠 **Módulo de Propiedades**

- [x] Modelo completo con relaciones
- [x] CRUD diferenciado por roles (agente/superadmin)
- [x] Ownership y control de acceso
- [x] Cascade delete de tareas asociadas
- [x] Rutas públicas y privadas
- [x] **Tests:** 32 tests de integración
      
#### 📋 **Módulo de Tareas**

- [x] Sistema completo de tareas vinculadas a propiedades
- [x] Asignación automática basada en ownership
- [x] CRUD diferenciado por roles
- [x] Integridad referencial con propiedades
- [x] Optimizaciones con filtros combinados
- [x] **Tests:** 47 tests de integración

#### 🧪 **Testing y Calidad**
- [x] **260 tests** implementados (100% passing)
- [x] **90.75% cobertura** de código
- [x] **100% funciones** cubiertas
- [x] Middlewares con cobertura completa
- [x] Pruebas de integración con BD en memoria
- [x] Documentación de coverage en docs/
      
### 📋**Modulo de Tests**

- [x] **Colección Postman:** Pruebas de integración completas

---
## 📚 Cumplimiento de Requisitos

### ✅ **Requisitos Funcionales Implementados**

#### 👥 **Gestión de Usuarios**
- [x] Superadmin puede crear, modificar y eliminar usuarios
- [x] Roles implementados: `superadmin`, `agente` (usuario regular)
- [x] Usuarios autenticados pueden ver/editar su perfil
- [x] Solo superadmin puede gestionar otros usuarios
- [x] **Tests:** 25 tests en services + 40 en controller

#### 🔐 **Autenticación y Autorización**
- [x] Sistema JWT completo con middleware de autenticación
- [x] Middleware de validación de roles para cada operación
- [x] Rutas protegidas según permisos de usuario
- [x] **Tests:** Cobertura 100% en middlewares

#### 🏠📋 **Módulos Interrelacionados**
- [x] **Módulo Propiedades:** CRUD completo con ownership
- [x] **Módulo Tareas:** CRUD vinculado a propiedades
- [x] Relación directa entre propiedades y tareas
- [x] Gestión diferenciada por roles (agente vs superadmin)
- [x] **Tests:** 75 tests en services + 79 en controllers

#### 🔄 **Características Adicionales**
- [x] Integridad referencial (cascade delete, validación dependencias)
- [x] Optimizaciones de rendimiento (filtros combinados)
- [x] Error handling centralizado
- [x] Arquitectura escalable con DTOs y Services
- [x] **Tests:** 100% cobertura en serializers y utils

### ✅ **Requisitos Técnicos Cumplidos**
- [x] **Pruebas Unitarias:** ✨ **90.75% cobertura** (supera el 80% requerido)
- [x] **260 tests** implementados con Jest + Supertest
- [x] **Documentación completa** de testing en docs/
- [x] **Reporte HTML** interactivo de cobertura
---
