import { Router } from 'express';
import { 
  getAllPropertiesController, 
  getPropertyByIdController,
  createPropertyByAgentController,
  updatePropertyByAgentController,
  deletePropertyByAgentController,
  createPropertyByAdminController,
  updatePropertyByAdminController,
  deletePropertyByAdminController
} from '../controllers/property.controller';
import { authMiddleware, checkRole } from '../middlewares/auth.middleware';

const propertyRoutes = Router();

// --- Rutas Públicas ---
// Cualquier usuario (incluidos no autenticados) puede ver propiedades
propertyRoutes.get('/', getAllPropertiesController);
propertyRoutes.get('/:id', getPropertyByIdController);

// --- Rutas Privadas para Agentes ---
// Solo agentes autenticados pueden crear y gestionar SUS propiedades
propertyRoutes.post('/agent', authMiddleware, checkRole(['agente']), createPropertyByAgentController);
propertyRoutes.put('/agent/:id', authMiddleware, checkRole(['agente']), updatePropertyByAgentController);
propertyRoutes.delete('/agent/:id', authMiddleware, checkRole(['agente']), deletePropertyByAgentController);

// --- Rutas Privadas para Superadmin ---
// Solo superadmin puede gestionar CUALQUIER propiedad y asignar owners
propertyRoutes.post('/admin', authMiddleware, checkRole(['superadmin']), createPropertyByAdminController);
propertyRoutes.put('/admin/:id', authMiddleware, checkRole(['superadmin']), updatePropertyByAdminController);
propertyRoutes.delete('/admin/:id', authMiddleware, checkRole(['superadmin']), deletePropertyByAdminController);

export default propertyRoutes;
