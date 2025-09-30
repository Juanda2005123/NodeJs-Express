// tests/helpers/db.helper.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;
let isConnected = false;

/**
 * Conecta a MongoDB en memoria para pruebas
 */
export const connectTestDB = async () => {
  try {
    // Si ya está conectado, no hacer nada
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('✅ Ya conectado a MongoDB en memoria');
      return;
    }

    // Cerrar conexión existente si la hay
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Crear nueva instancia de MongoDB en memoria
    if (mongoServer) {
      await mongoServer.stop();
    }

    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 0, // Puerto aleatorio
        dbName: `test_${Date.now()}`, // DB name único
      },
    });
    
    const mongoUri = mongoServer.getUri();

    // Conectar con configuración robusta
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 segundos timeout
      socketTimeoutMS: 45000,
      family: 4, // IPv4
      maxPoolSize: 10,
      retryWrites: false, // Importante para tests
    });

    isConnected = true;
    console.log('✅ Conectado a MongoDB en memoria');
    
    // Event listeners para debug
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('error', (error) => {
      isConnected = false;
      console.error('❌ Error en conexión MongoDB:', error.message);
    });

  } catch (error) {
    isConnected = false;
    console.error('❌ Error conectando a MongoDB de prueba:', error);
    throw error;
  }
};

/**
 * Desconecta y detiene el servidor de MongoDB en memoria
 */
export const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null as any;
    }
    
    isConnected = false;
    console.log('🔌 Desconectado de MongoDB en memoria');
  } catch (error) {
    isConnected = false;
    console.error('❌ Error desconectando de MongoDB de prueba:', error);
    // No relanzamos el error para evitar problemas en teardown
  }
};

/**
 * Limpia todas las colecciones de la base de datos
 */
export const clearTestDB = async () => {
  try {
    // Verificar conexión antes de limpiar
    if (!isConnected || mongoose.connection.readyState !== 1) {
      console.log('⚠️  Base de datos no conectada, reintentando conexión...');
      await connectTestDB();
    }

    // Intentar limpiar con timeout
    const collections = mongoose.connection.collections;
    const collectionNames = Object.keys(collections);
    
    if (collectionNames.length === 0) {
      console.log('🧹 No hay colecciones que limpiar');
      return;
    }

    // Limpiar cada colección con timeout individual
    const cleanPromises = collectionNames.map(async (name) => {
      const collection = collections[name];
      if (collection) {
        try {
          // Usar timeout de 10 segundos para cada operación de limpieza
          let timeoutId: NodeJS.Timeout;
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Timeout limpiando colección')), 10000);
          });
          
          const clearPromise = collection.deleteMany({});
          
          try {
            await Promise.race([clearPromise, timeoutPromise]);
          } finally {
            // Limpiar el timeout para evitar handles abiertos
            clearTimeout(timeoutId);
          }
        } catch (error: any) {
          console.warn(`⚠️  No se pudo limpiar la colección ${name}:`, error.message);
        }
      }
    });

    await Promise.allSettled(cleanPromises);
    console.log('🧹 Base de datos limpiada');
    
  } catch (error) {
    console.warn('⚠️  Error general limpiando base de datos:', error.message);
    
    // Si falla la limpieza, intentar reconectar para la siguiente prueba
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      console.log('🔄 Intentando reconexión por error de limpieza...');
      isConnected = false;
      try {
        await connectTestDB();
      } catch (reconnectError) {
        console.error('❌ Error en reconexión:', reconnectError.message);
      }
    }
  }
};

/**
 * Verifica si la conexión está activa
 */
export const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};