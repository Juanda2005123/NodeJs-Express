import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

export const connectDB = async () => {
  if (!MONGO_URI) {
    console.error('Error: La variable de entorno MONGO_URI no está definida.');
    process.exit(1); // Detiene la aplicación si no hay string de conexión
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexión a MongoDB exitosa');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1); // Detiene la aplicación si la conexión falla
  }
};