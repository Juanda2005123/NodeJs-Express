// scripts/seed.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../src/models/User.model';

dotenv.config();



const MONGO_URI = process.env.MONGO_URI;

const seedDatabase = async () => {
  if (!MONGO_URI) {
    console.error('Error: La variable de entorno MONGO_URI no está definida.');
    process.exit(1);
  }

  try {
    console.log('🌱 Conectando a la base de datos para la siembra...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexión exitosa.');

    // --- 1. Sembrar Superadmin ---
    const superAdminEmail = 'superadmin@inmobiliaria.com';
    const existingSuperAdmin = await UserModel.findOne({ email: superAdminEmail });

    if (!existingSuperAdmin) {
      console.log('🌱 Creando el usuario superadmin...');
      const superAdmin = new UserModel({
        name: 'Super Admin',
        email: superAdminEmail,
        password: 'superadminpassword123',
        role: 'superadmin'
      });
      await superAdmin.save();
      console.log('✅ ¡Superadmin creado exitosamente!');
    } else {
      console.log('ℹ️ El superadmin ya existe.');
    }

    // --- 2. Sembrar Agente de Prueba --- // --> NUEVO BLOQUE
    const testAgentEmail = 'agente.prueba@inmobiliaria.com';
    const existingTestAgent = await UserModel.findOne({ email: testAgentEmail });

    if (!existingTestAgent) {
      console.log('🌱 Creando el usuario agente de prueba...');
      const testAgent = new UserModel({
        name: 'Agente de Pruebas',
        email: testAgentEmail,
        password: 'agentepassword123',
        role: 'agente'
      });
      await testAgent.save();
      console.log('✅ ¡Agente de prueba creado exitosamente!');
    } else {
      console.log('ℹ️ El agente de prueba ya existe.');
    }
    
    // --- Imprimir credenciales para referencia ---
    console.log('\n--- Credenciales de Siembra ---');
    console.log(`🔑 Superadmin: ${superAdminEmail} / superadminpassword123`);
    console.log(`🔑 Agente de Prueba: ${testAgentEmail} / agentepassword123`);
    console.log('---------------------------------');

  } catch (error) {
    console.error('❌ Error durante la siembra:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔗 Desconectado de la base de datos.');
  }
};

// Ejecutar la función
seedDatabase();