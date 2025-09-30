// tests/helpers/db.helper.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

/**
 * Conecta a MongoDB en memoria para pruebas
 */
export const connectTestDB = async () => {
  try {
    // Crear instancia de MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Conectar Mongoose
    await mongoose.connect(mongoUri);

    console.log('✅ Conectado a MongoDB en memoria');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB de prueba:', error);
    throw error;
  }
};

/**
 * Desconecta y detiene el servidor de MongoDB en memoria
 */
export const disconnectTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('🔌 Desconectado de MongoDB en memoria');
  } catch (error) {
    console.error('❌ Error desconectando de MongoDB de prueba:', error);
    throw error;
  }
};

/**
 * Limpia todas las colecciones de la base de datos
 */
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
        await collection.deleteMany({});
      }
  }
  
  console.log('🧹 Base de datos limpiada');
};