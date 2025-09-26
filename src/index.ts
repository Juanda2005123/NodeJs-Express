import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db'; 

// 1. Cargar las variables de entorno del archivo .env
dotenv.config();

// Conectar a la base de datos
connectDB();

// 2. Inicializar la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middleware para permitir que Express entienda JSON
app.use(express.json());

// 4. Ruta de prueba para verificar que el servidor funciona
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('API de Bienes Raíces funcionando correctamente!');
});

// 5. Poner el servidor a escuchar en el puerto especificado
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});