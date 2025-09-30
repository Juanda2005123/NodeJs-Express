import mongoose from 'mongoose';

export const connectDB = async () => {
  // Leer la variable DENTRO de la función, no en el top-level
  const MONGO_URI = process.env.MONGO_URI;
  
  if (!MONGO_URI) {
    console.error('❌ Error: La variable de entorno MONGO_URI no está definida.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1); // Detiene la aplicación si la conexión falla
  }
};