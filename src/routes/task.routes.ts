import { Router } from 'express';
import { 
  getAllTasksByAgentController, 
  getTaskByIdAgentController,
  getTasksByPropertyAgentController,
  createTaskByAgentController,
  updateTaskByAgentController,
  deleteTaskByAgentController,
  getAllTasksController,
  getTaskByIdAdminController,
  getTasksByPropertyAdminController,
  createTaskByAdminController,
  updateTaskByAdminController,
  deleteTaskByAdminController
} from '../controllers/task.controller';
import { authMiddleware, checkRole } from '../middlewares/auth.middleware';

const taskRoutes = Router();

// --- Rutas Privadas para Agentes ---
// Solo agentes autenticados pueden gestionar SUS tareas asignadas
taskRoutes.get('/agent', authMiddleware, checkRole(['agente']), getAllTasksByAgentController);
taskRoutes.get('/agent/:id', authMiddleware, checkRole(['agente']), getTaskByIdAgentController);
taskRoutes.get('/property/:propertyId', authMiddleware, checkRole(['agente']), getTasksByPropertyAgentController);
taskRoutes.post('/agent', authMiddleware, checkRole(['agente']), createTaskByAgentController);
taskRoutes.put('/agent/:id', authMiddleware, checkRole(['agente']), updateTaskByAgentController);
taskRoutes.delete('/agent/:id', authMiddleware, checkRole(['agente']), deleteTaskByAgentController);

// --- Rutas Privadas para Superadmin ---
// Solo superadmin puede gestionar CUALQUIER tarea y asignar propiedades
taskRoutes.get('/admin', authMiddleware, checkRole(['superadmin']), getAllTasksController);
taskRoutes.get('/admin/:id', authMiddleware, checkRole(['superadmin']), getTaskByIdAdminController);
taskRoutes.get('/admin/property/:propertyId', authMiddleware, checkRole(['superadmin']), getTasksByPropertyAdminController);
taskRoutes.post('/admin', authMiddleware, checkRole(['superadmin']), createTaskByAdminController);
taskRoutes.put('/admin/:id', authMiddleware, checkRole(['superadmin']), updateTaskByAdminController);
taskRoutes.delete('/admin/:id', authMiddleware, checkRole(['superadmin']), deleteTaskByAdminController);

export default taskRoutes;
