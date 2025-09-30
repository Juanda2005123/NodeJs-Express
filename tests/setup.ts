// tests/setup.ts
import { config } from 'dotenv';

// Cargar variables de entorno de prueba
config({ path: '.env.test' });

// Configuración global de Jest
beforeAll(() => {
  console.log('🧪 Iniciando suite de pruebas...');
});

afterAll(() => {
  console.log('✅ Pruebas completadas');
});

// Aumentar timeout para pruebas de BD
jest.setTimeout(30000);