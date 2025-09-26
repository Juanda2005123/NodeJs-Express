// 1. Importamos las herramientas necesarias
import { Router } from 'express'; // Router es como una "mini-aplicación" de Express para manejar rutas.
import { registerUserController } from '../controllers/user.controller'; // Importamos el controlador que atenderá la petición.

// 2. Creamos una nueva instancia del Router
const userRoutes = Router();

// 3. Definimos las rutas para este módulo
// Le decimos al router: "Cuando recibas una petición POST en la ruta raíz ('/'),
// ejecuta la función registerUserController".
// La ruta completa será definida cuando conectemos este router a la app principal.
userRoutes.post('/register', registerUserController);

// Podríamos añadir más rutas aquí en el futuro...
// userRoutes.post('/login', loginUserController);
// userRoutes.get('/', getAllUsersController);

// 4. Exportamos el router para que nuestra aplicación principal pueda usarlo
export default userRoutes;