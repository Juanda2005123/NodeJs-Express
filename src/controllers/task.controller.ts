import { type Request, type Response, type NextFunction } from 'express';
import { serializeTask } from '../utils/task.serializer';
import { getAllTaskService, getAllTasksByAgentService, getTaskByIdForAgentService, getTaskByIdForAdminService, getTasksByPropertyForAgentService, getTasksByPropertyForAdminService, createTaskByAgentService, createTaskByAdminService, deleteTaskByAgentService, deleteTaskByAdminService, updateTaskByAgentService, updateTaskByAdminService } from '../services/task.service';
import { type TaskListResponseDto, type CreateTaskDto, type UpdateTaskByAgentDto, type UpdateTaskByAdminDto } from '../dtos/task.dto';

// --- Controladores para Agentes ---

/**
 * @description Controlador para que un agente obtenga todas sus tareas asignadas.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getAllTasksByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.user!.id;
    
    const tasks = await getAllTasksByAgentService(agentId);
    const tasksResponse = tasks.map(task => serializeTask(task));
    
    const response: TaskListResponseDto = {
      tasks: tasksResponse,
      total: tasksResponse.length
    };
    
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente obtenga una tarea específica solo si está asignada a él.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getTaskByIdAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: taskId } = req.params;
    const agentId = req.user!.id;
    
    if (!taskId) {
      return res.status(400).json({ message: 'El ID de la tarea es requerido.' });
    }
    
    const task = await getTaskByIdForAgentService(taskId, agentId);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }
    
    const taskResponse = serializeTask(task);
    
    return res.status(200).json(taskResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente obtenga todas las tareas de una de sus propiedades.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getTasksByPropertyAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId } = req.params;
    const agentId = req.user!.id;
    
    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }
    
    const tasks = await getTasksByPropertyForAgentService(propertyId, agentId);
    
    if (tasks === null) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }
    
    const tasksResponse = tasks.map(task => serializeTask(task));
    
    const response: TaskListResponseDto = {
      tasks: tasksResponse,
      total: tasksResponse.length
    };
    
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente cree una nueva tarea en una de sus propiedades.
 * El assignedTo se asigna automáticamente al agente (owner de la propiedad).
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const createTaskByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.user!.id;
    
    const taskData: CreateTaskDto = {
      title: req.body.title,
      description: req.body.description,
      property: req.body.property
    };

    const newTask = await createTaskByAgentService(taskData, agentId);
    
    if (!newTask) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }
    
    const taskResponse = serializeTask(newTask);
    return res.status(201).json({ 
      message: 'Tarea creada exitosamente', 
      task: taskResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente actualice una de sus tareas asignadas.
 * Solo puede actualizar tareas que están asignadas a él.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const updateTaskByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: taskId } = req.params;
    const agentId = req.user!.id;

    if (!taskId) {
      return res.status(400).json({ message: 'El ID de la tarea es requerido.' });
    }

    const updateData: UpdateTaskByAgentDto = {
      title: req.body.title,
      description: req.body.description,
      isCompleted: req.body.isCompleted
    };

    // Limpiar campos undefined
    Object.keys(updateData).forEach(
      key => (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    const updatedTask = await updateTaskByAgentService(taskId, updateData, agentId);

    if (!updatedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    const taskResponse = serializeTask(updatedTask);
    return res.status(200).json({ 
      message: 'Tarea actualizada exitosamente', 
      task: taskResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente elimine una de sus tareas asignadas.
 * Solo puede eliminar tareas que están asignadas a él.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const deleteTaskByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: taskId } = req.params;
    const agentId = req.user!.id;

    if (!taskId) {
      return res.status(400).json({ message: 'El ID de la tarea es requerido.' });
    }

    // Servicio optimizado: elimina solo si existe Y está asignada al agente
    const deletedTask = await deleteTaskByAgentService(taskId, agentId);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --- Controladores para Superadmin ---

/**
 * @description Controlador para que un superadmin obtenga todas las tareas del sistema.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getAllTasksController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await getAllTaskService();
    const tasksResponse = tasks.map(task => serializeTask(task));
    
    const response: TaskListResponseDto = {
      tasks: tasksResponse,
      total: tasksResponse.length
    };
    
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin obtenga una tarea específica sin restricciones.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getTaskByIdAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({ message: 'El ID de la tarea es requerido.' });
    }
    
    const task = await getTaskByIdForAdminService(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }
    
    const taskResponse = serializeTask(task);
    
    return res.status(200).json(taskResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin obtenga todas las tareas de cualquier propiedad.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getTasksByPropertyAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId } = req.params;
    
    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }
    
    const tasks = await getTasksByPropertyForAdminService(propertyId);
    
    if (tasks === null) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }
    
    const tasksResponse = tasks.map(task => serializeTask(task));
    
    const response: TaskListResponseDto = {
      tasks: tasksResponse,
      total: tasksResponse.length
    };
    
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin cree una nueva tarea en cualquier propiedad.
 * El assignedTo se asigna automáticamente al owner de la propiedad.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const createTaskByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskData: CreateTaskDto = {
      title: req.body.title,
      description: req.body.description,
      property: req.body.property
    };

    const newTask = await createTaskByAdminService(taskData);
    
    if (!newTask) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }
    
    const taskResponse = serializeTask(newTask);
    return res.status(201).json({ 
      message: 'Tarea creada exitosamente por el administrador', 
      task: taskResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin actualice cualquier tarea.
 * Puede actualizar cualquier tarea sin restricciones de ownership.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const updateTaskByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ message: 'El ID de la tarea es requerido.' });
    }

    const updateData: UpdateTaskByAdminDto = {
      title: req.body.title,
      description: req.body.description,
      isCompleted: req.body.isCompleted,
      property: req.body.property
    };

    // Limpiar campos undefined
    Object.keys(updateData).forEach(
      key => (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    const updatedTask = await updateTaskByAdminService(taskId, updateData);

    if (!updatedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    const taskResponse = serializeTask(updatedTask);
    return res.status(200).json({ 
      message: 'Tarea actualizada exitosamente por el administrador', 
      task: taskResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin elimine cualquier tarea sin restricciones.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const deleteTaskByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ message: 'El ID de la tarea es requerido.' });
    }

    // Servicio específico para superadmin sin restricciones
    const deletedTask = await deleteTaskByAdminService(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};