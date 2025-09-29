# Reglas de Negocio y Flujo de Trabajo de la API

Este documento describe la lógica de negocio, los roles de usuario y las interrelaciones entre los diferentes módulos de la API de gestión inmobiliaria.

## 1. Usuarios (Roles y Capacidades)

La aplicación define dos roles de usuario con capacidades distintas:

- **superadmin**: Representa al administrador o jefe de la agencia. Tiene control total sobre todos los recursos del sistema.
- **agente**: Representa a un empleado o agente inmobiliario. Tiene permisos limitados a los recursos que le pertenecen o le son asignados.

## 2. Propiedades (Property)

Una **Property** es el recurso principal de la aplicación. Representa un inmueble gestionado por la agencia.

### Creación (POST)

**Un agente puede crear una propiedad:**
- La propiedad creada se le asigna automáticamente a él como propietario (`owner`).
- El `owner` se extrae del ID del token JWT del agente (`req.user.id`).
- El agente no puede especificar un `owner` diferente.

**Un superadmin puede crear una propiedad:**
- El superadmin debe especificar el ID del agente que será el `owner` de la propiedad en el cuerpo de la petición.
- Esto permite al superadmin asignar nuevas propiedades a cualquier agente de la agencia.

### Lectura (GET)

- Listar todas las propiedades y ver una propiedad por ID es una **acción pública**.
- No se requiere autenticación para estas operaciones, permitiendo que la información sea consumida por un catálogo público.

### Actualización (PUT)

**Un agente puede actualizar una propiedad:**
- Solo si es el `owner` de dicha propiedad.
- No puede cambiar el `owner` de la propiedad (no puede reasignarla).

**Un superadmin puede actualizar CUALQUIER propiedad:**
- Puede modificar todos los campos, incluyendo reasignar la propiedad a un nuevo agente cambiando el campo `owner`.

### Eliminación (DELETE)

**Un agente puede eliminar una propiedad:**
- Solo si es el `owner` de dicha propiedad.

**Un superadmin puede eliminar CUALQUIER propiedad.**

## 3. Tareas (Task)

Una **Task** es una acción o recordatorio asociado a una **Property**. Su lógica está directamente vinculada al propietario de la propiedad.

### Creación (POST)

- Para crear una tarea, se debe especificar a qué `property` pertenece.
- El campo `assignedTo` (el responsable de la tarea) se establece automáticamente al `owner` de la propiedad especificada. **Esta es una regla de negocio inmutable**.

**Un agente puede crear una tarea:**
- Solo para una propiedad de la que es `owner`.

**Un superadmin puede crear una tarea:**
- Para cualquier propiedad. La tarea se asignará automáticamente al agente que sea el `owner` de esa propiedad.

### Lectura (GET)

**Un agente puede ver:**
- Únicamente la lista de tareas que le han sido asignadas a él (`assignedTo` coincide con su ID).

**Un superadmin puede ver TODAS las tareas** de todos los agentes.

### Actualización (PUT)

**Un agente puede actualizar una tarea:**
- Solo si es la persona a la que se le asignó la tarea (`assignedTo`).

**Un superadmin puede actualizar CUALQUIER tarea.**

### Eliminación (DELETE)

**Un agente puede eliminar una tarea:**
- Solo si es la persona a la que se le asignó la tarea.

**Un superadmin puede eliminar CUALQUIER tarea.**

## 4. Interrelaciones Clave (Resumen)

El diseño de la base de datos se basa en referencias para mantener la flexibilidad y evitar la duplicación de datos.

- Un **User** puede ser `owner` de muchas **Properties**.
- Una **Property** tiene exactamente un `owner` (que es un **User**).
- Una **Task** pertenece a exactamente una **Property**.
- Una **Task** está asignada a exactamente un **User**, que es siempre el `owner` de la **Property** a la que pertenece la tarea.

---

### Diagrama de Relaciones

```
User (superadmin/agente)
 ├── owner of → Property (1:N)
 └── assignedTo ← Task (1:N)

Property
 ├── belongs to → User (owner) (N:1)
 └── has → Task (1:N)

Task
 ├── belongs to → Property (N:1)
 └── assigned to → User (N:1)
```

---

*Documento actualizado: Septiembre 2025*
