// tests/setup.ts
import { config } from 'dotenv';

// Configurar variables de entorno antes de cualquier otra cosa
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens-in-testing-environment';
process.env.PORT = '3001';
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// Intentar cargar variables de entorno de .env.test si existe
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