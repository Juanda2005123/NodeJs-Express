// Bun carga automáticamente las variables de entorno con --env-file=.env
// No necesitamos importar dotenv aquí
import express, { type Request, type Response } from 'express';
import { connectDB } from './config/db';
import userRoutes from './routes/user.routes';
import propertyRoutes from './routes/property.routes';
import taskRoutes from './routes/task.routes';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware';


// 3. Conectar a la base de datos
connectDB();

// 4. Inicializar la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 5. Middleware para permitir que Express entienda JSON
app.use(express.json());

// --- PUNTOS DE ENTRADA (ENDPOINTS) DE LA API ---

// Ruta raíz de la API para verificar que está viva
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API de Bienes Raíces funcionando' });
});

// Montar las rutas
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tasks', taskRoutes);
app.use(errorHandlerMiddleware);

// Poner el servidor a escuchar en el puerto especificado

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});