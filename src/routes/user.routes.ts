// 1. Importamos las herramientas necesarias
import { Router } from 'express'; // Router es como una "mini-aplicación" de Express para manejar rutas.
import { registerUserController, loginUserController, getUserProfileController, getAllUsersController, createUserController, getUserByIdController, updateUserProfileController, updateUserByAdminController, deleteUserAccountController, deleteUserByAdminController } from '../controllers/user.controller'; 
import { authMiddleware, checkRole } from '../middlewares/auth.middleware';

// 2. Creamos una nueva instancia del Router
const userRoutes = Router();

// --- Rutas Públicas ---
userRoutes.post('/register', registerUserController);
userRoutes.post('/login', loginUserController);

// --- Rutas Privadas para el Usuario Propio ---
userRoutes.get('/me', authMiddleware, getUserProfileController);
userRoutes.put('/me', authMiddleware, updateUserProfileController);
userRoutes.delete('/me', authMiddleware, deleteUserAccountController);


// --- Rutas Privadas para Administradores ---
userRoutes.post('/', authMiddleware, checkRole(['superadmin']), createUserController);
userRoutes.get('/', authMiddleware, checkRole(['superadmin']), getAllUsersController);
userRoutes.get('/:id', authMiddleware, checkRole(['superadmin']), getUserByIdController);
userRoutes.put('/:id', authMiddleware, checkRole(['superadmin']), updateUserByAdminController);
userRoutes.delete('/:id', authMiddleware, checkRole(['superadmin']), deleteUserByAdminController);

// 4. Exportamos el router para que nuestra aplicación principal pueda usarlo
export default userRoutes;