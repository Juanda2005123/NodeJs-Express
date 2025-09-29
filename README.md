# 🏢 API de Gestión Inmobiliaria - Taller Backend NodeJS

<div align="center">
  
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
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

El objetivo de este proyecto es desarrollar una API backend para una herramienta interna de una agencia inmobiliaria. La aplicación permite gestionar usuarios (con roles de `superadmin` y `agente`), propiedades y las tareas asociadas a dichas propiedades.

### ✨ Funcionalidades Principales

- **👥 Gestión de Usuarios:** Sistema completo de CRUD para usuarios con roles
- **🔐 Autenticación y Autorización:** Implementación de seguridad basada en JSON Web Tokens (JWT)
- **🛡️ Roles y Permisos:** Dos niveles de acceso:
  - `superadmin`: Control total sobre todos los usuarios, propiedades y tareas
  - `agente`: Puede gestionar las propiedades y tareas que se le asignan
- **🏠 Gestión de Propiedades:** *(Futuro Módulo)* CRUD para las propiedades de la agencia
- **📝 Gestión de Tareas:** *(Futuro Módulo)* CRUD para las tareas asociadas a las propiedades

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

## ☁️ Despliegue

🌐 **API Desplegada:** [URL_DE_TU_API_DESPLEGADA]

![Website Status](https://img.shields.io/website?up_message=online&down_message=offline&url=URL_DE_TU_API_DESPLEGADA)

---

## 📈 Roadmap del Proyecto (BORRAR LUEGO, ES PARA LLEVAR EL PROGRESO)

### 🎯 **Fase 1: Módulo de Usuarios** *(En Progreso)*
- [x] Autenticación básica (Login/Register)
- [x] Middlewares de autorización
- [ ] CRUD completo de usuarios (Rutas protegidas)

### 🏠 **Fase 2: Módulo de Propiedades** *(Planeado)*
- [ ] Modelo de propiedades
- [ ] CRUD de propiedades
- [ ] Asignación de propiedades a agentes

### 📋 **Fase 3: Módulo de Tareas** *(Futuro)*
- [ ] Sistema de tareas
- [ ] Asignación de tareas
- [ ] Estados y seguimiento

---

<div align="center">
  
