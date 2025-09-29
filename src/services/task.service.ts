import {type UpdateTaskByAgentDto, type UpdateTaskByAdminDto, type TaskListResponseDto, type TaskResponseDto, type CreateTaskDto} from '../dtos/task.dto';
import TaskModel from '../models/Task.model';
import PropertyModel from '../models/Property.model';

/**
 * @description Servicio para que un agente cree una nueva tarea en una de sus propiedades.
 * Optimizado: usa filtro combinado para verificar existencia y ownership en una consulta.
 * @param taskData - El DTO con los datos de la tarea a crear (incluye property).
 * @param agentId - El ID del agente (obtenido del token JWT) que crea la tarea.
 * @returns El documento de la tarea recién creada o null si la propiedad no existe o no es propietario.
 * @throws Lanza un error si la operación de guardado falla.
 */
export const createTaskByAgentService = async (taskData: CreateTaskDto, agentId: string) => {
    try {
        // Filtro combinado: verifica que la propiedad existe Y pertenece al agente
        const property = await PropertyModel.findOne({
            _id: taskData.property,
            owner: agentId
        });

        if (!property) {
            return null; // Propiedad no encontrada o no es propietario
        }

        // Creamos la tarea asignándola automáticamente al propietario (agente)
        const newTaskData = {
            ...taskData,
            assignedTo: agentId // REGLA DE NEGOCIO: assignedTo = owner de la property
        };

        const newTask = new TaskModel(newTaskData);
        await newTask.save();

        return newTask;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin cree una nueva tarea en cualquier propiedad.
 * @param taskData - El DTO con los datos de la tarea a crear (incluye property).
 * @returns El documento de la tarea recién creada o null si la propiedad no existe.
 * @throws Lanza un error si la operación de guardado falla.
 */
export const createTaskByAdminService = async (taskData: CreateTaskDto) => {
    try {
        // Verificamos que la propiedad existe y obtenemos su owner
        const property = await PropertyModel.findById(taskData.property);

        if (!property) {
            return null; // Propiedad no encontrada
        }

        // Creamos la tarea asignándola automáticamente al owner de la propiedad
        const newTaskData = {
            ...taskData,
            assignedTo: property.owner // REGLA DE NEGOCIO: assignedTo = owner de la property
        };

        const newTask = new TaskModel(newTaskData);
        await newTask.save();

        return newTask;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente actualice una de sus tareas asignadas.
 * Optimizado: usa filtro combinado para actualizar solo si está asignada al agente.
 * @param taskId - El ID de la tarea a actualizar.
 * @param taskData - El DTO con los datos a actualizar.
 * @param agentId - El ID del agente que realiza la petición.
 * @returns El documento de la tarea actualizada o null si no se encuentra o no está asignada al agente.
 * @throws Lanza un error si la operación de actualización falla.
 */
export const updateTaskByAgentService = async (taskId: string, taskData: UpdateTaskByAgentDto, agentId: string) => {
    try {
        // Filtro combinado: actualiza solo si la tarea existe Y está asignada al agente
        const updatedTask = await TaskModel.findOneAndUpdate(
            { 
                _id: taskId, 
                assignedTo: agentId 
            }, 
            taskData, 
            { new: true }
        );

        if (!updatedTask) {
            return null; // Tarea no encontrada o no asignada al agente
        }
        
        return updatedTask;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin actualice cualquier tarea.
 * Si se cambia la propiedad, automáticamente se recalcula el assignedTo.
 * @param taskId - El ID de la tarea a actualizar.
 * @param taskData - El DTO con los datos a actualizar (puede incluir property).
 * @returns El documento de la tarea actualizada o null si no se encuentra.
 * @throws Lanza un error si la operación de actualización falla.
 */
export const updateTaskByAdminService = async (taskId: string, taskData: UpdateTaskByAdminDto) => {
    try {
        let finalTaskData: any = { ...taskData };

        // Si se está cambiando la propiedad, recalculamos el assignedTo
        if (taskData.property) {
            const property = await PropertyModel.findById(taskData.property);
            
            if (!property) {
                return null; // Nueva propiedad no encontrada
            }

            // REGLA DE NEGOCIO: assignedTo siempre es el owner de la property
            finalTaskData.assignedTo = property.owner;
        }

        const updatedTask = await TaskModel.findByIdAndUpdate(taskId, finalTaskData, { new: true });

        if (!updatedTask) {
            return null; // Tarea no encontrada
        }

        return updatedTask;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente elimine una de sus tareas asignadas.
 * Optimizado: usa filtro combinado para eliminar solo si está asignada al agente.
 * @param taskId - El ID de la tarea a eliminar.
 * @param agentId - El ID del agente que solicita la eliminación.
 * @returns El documento de la tarea eliminada o null si no se encuentra o no está asignada al agente.
 * @throws Lanza un error si la operación de eliminación falla.
 */
export const deleteTaskByAgentService = async (taskId: string, agentId: string) => {
    try {
        // Filtro combinado: elimina solo si la tarea existe Y está asignada al agente
        const deletedTask = await TaskModel.findOneAndDelete({
            _id: taskId,
            assignedTo: agentId
        });

        if (!deletedTask) {
            return null; // Tarea no encontrada o no asignada al agente
        }

        return deletedTask;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin elimine cualquier tarea sin restricciones.
 * @param taskId - El ID de la tarea a eliminar.
 * @returns El documento de la tarea eliminada o null si no se encuentra.
 * @throws Lanza un error si la operación de eliminación falla.
 */
export const deleteTaskByAdminService = async (taskId: string) => {
    try {
        const deletedTask = await TaskModel.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return null; // Tarea no encontrada para eliminar
        }

        return deletedTask;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para obtener todas las tareas con información de propiedad y usuario asignado.
 * Property incluye owner como ID (sin poblar) para evitar duplicación con assignedTo.
 * @returns Array de tareas con property (owner como ID) y assignedTo poblados (vacío si no hay tareas).
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getAllTaskService = async () => {
    try {
        const tasks = await TaskModel.find()
            .populate('property') // Property completa pero owner será solo ID
            .populate('assignedTo', '-password'); // assignedTo como objeto completo
        return tasks;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente obtenga todas sus tareas asignadas.
 * @param agentId - El ID del agente que solicita sus tareas.
 * @returns Array de tareas asignadas al agente con property y assignedTo poblados (vacío si no tiene tareas).
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getAllTasksByAgentService = async (agentId: string) => {
    try {
        const tasks = await TaskModel.find({ assignedTo: agentId })
            .populate('property')
            .populate('assignedTo', '-password');
        return tasks;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente obtenga una tarea específica solo si está asignada a él.
 * Optimizado: usa filtro combinado en lugar de validación posterior.
 * @param taskId - El ID de la tarea a buscar.
 * @param agentId - El ID del agente que solicita la tarea.
 * @returns El documento de la tarea con property y assignedTo poblados o null si no se encuentra o no está asignada al agente.
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getTaskByIdForAgentService = async (taskId: string, agentId: string) => {
    try {
        // Filtro combinado: busca por ID Y que esté asignada al agente
        const task = await TaskModel.findOne({ 
            _id: taskId, 
            assignedTo: agentId 
        })
            .populate('property')
            .populate('assignedTo', '-password');

        if (!task) {
            return null; // Tarea no encontrada o no asignada al agente
        }

        return task;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin obtenga una tarea específica sin restricciones.
 * @param taskId - El ID de la tarea a buscar.
 * @returns El documento de la tarea con property y assignedTo poblados o null si no se encuentra.
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getTaskByIdForAdminService = async (taskId: string) => {
    try {
        const task = await TaskModel.findById(taskId)
            .populate('property')
            .populate('assignedTo', '-password');

        if (!task) {
            return null; // Tarea no encontrada
        }

        return task;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente obtenga todas las tareas de una de sus propiedades.
 * Optimizado: usa filtro combinado para verificar existencia y ownership en una consulta.
 * @param propertyId - El ID de la propiedad.
 * @param agentId - El ID del agente que solicita las tareas.
 * @returns Array de tareas de la propiedad con property y assignedTo poblados (vacío si no hay tareas) o null si la propiedad no existe o no es propietario.
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getTasksByPropertyForAgentService = async (propertyId: string, agentId: string) => {
    try {
        // Filtro combinado: verifica que la propiedad existe Y pertenece al agente
        const property = await PropertyModel.findOne({
            _id: propertyId,
            owner: agentId
        });

        if (!property) {
            return null; // Propiedad no encontrada o no es propietario
        }

        // Obtener todas las tareas de la propiedad
        const tasks = await TaskModel.find({ property: propertyId })
            .populate('property')
            .populate('assignedTo', '-password');

        return tasks;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin obtenga todas las tareas de cualquier propiedad.
 * @param propertyId - El ID de la propiedad.
 * @returns Array de tareas de la propiedad con property y assignedTo poblados (vacío si no hay tareas) o null si la propiedad no existe.
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getTasksByPropertyForAdminService = async (propertyId: string) => {
    try {
        // Verificar que la propiedad existe
        const property = await PropertyModel.findById(propertyId);

        if (!property) {
            return null; // Propiedad no encontrada
        }

        // Obtener todas las tareas de la propiedad sin restricciones
        const tasks = await TaskModel.find({ property: propertyId })
            .populate('property')
            .populate('assignedTo', '-password');

        return tasks;
    } catch (error) {
        throw error;
    }
};    