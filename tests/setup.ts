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
// Solo aplicar si jest está disponible (no en Bun test)
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

// Suprimir warnings de deprecación de MongoDB Memory Server
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';