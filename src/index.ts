import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import userRoutes from './routes/user.routes';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware';


// 1. Cargar las variables de entorno del archivo .env
dotenv.config();

// Conectar a la base de datos
connectDB();

// 2. Inicializar la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middleware para permitir que Express entienda JSON
app.use(express.json());

// --- PUNTOS DE ENTRADA (ENDPOINTS) DE LA API ---

// Ruta raíz de la API para verificar que está viva
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API de Bienes Raíces funcionando' });
});

// 2. "MONTA" LAS RUTAS DE USUARIO
// Le decimos a Express: "Cualquier petición que empiece con '/api/users',
// pásasela al router 'userRoutes' para que él decida qué hacer."
app.use('/api/users', userRoutes);

app.use(errorHandlerMiddleware);


// 5. Poner el servidor a escuchar en el puerto especificado

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});