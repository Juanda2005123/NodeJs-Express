// 1. Importamos las herramientas necesarias
import { Router } from 'express'; // Router es como una "mini-aplicación" de Express para manejar rutas.
import { registerUserController, loginUserController, getUserProfileController } from '../controllers/user.controller'; 
import { authMiddleware } from '../middlewares/auth.middleware';

// 2. Creamos una nueva instancia del Router
const userRoutes = Router();

// --- Rutas Públicas (no necesitan token) ---
userRoutes.post('/register', registerUserController);
userRoutes.post('/login', loginUserController);

// --- Rutas Privadas (requieren un token válido) ---
// Aquí está la clave: pasamos 'authMiddleware' como el SEGUNDO argumento.
// Express lo ejecutará primero. Si authMiddleware llama a next(), entonces se ejecutará getUserProfileController.
// Si no, la petición morirá en el middleware.
userRoutes.get('/me', authMiddleware, getUserProfileController);

// 4. Exportamos el router para que nuestra aplicación principal pueda usarlo
export default userRoutes;