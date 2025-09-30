// tests/helpers/factories.ts
import { Types } from 'mongoose';

/**
 * Factory para crear datos de usuario de prueba
 */
export const userFactory = {
  agent: (overrides = {}) => ({
    name: 'Test Agent',
    email: `agent${Date.now()}@test.com`,
    password: 'password123',
    role: 'agente' as const,
    ...overrides,
  }),

  superadmin: (overrides = {}) => ({
    name: 'Test Superadmin',
    email: `admin${Date.now()}@test.com`,
    password: 'admin123',
    role: 'superadmin' as const,
    ...overrides,
  }),
};

/**
 * Factory para crear datos de propiedad de prueba
 */
export const propertyFactory = {
  basic: (ownerId: string | Types.ObjectId, overrides = {}) => ({
    title: 'Casa de Prueba',
    description: 'Una hermosa casa para testing',
    price: 250000,
    location: 'Cali, Colombia',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    imageUrls: ['https://example.com/image1.jpg'],
    owner: ownerId,
    ...overrides,
  }),
};

/**
 * Factory para crear datos de tarea de prueba
 */
export const taskFactory = {
  basic: (propertyId: string | Types.ObjectId, assignedToId: string | Types.ObjectId, overrides = {}) => ({
    title: 'Tarea de Prueba',
    description: 'Descripción de la tarea',
    isCompleted: false,
    property: propertyId,
    assignedTo: assignedToId,
    ...overrides,
  }),
};

/**
 * Genera un ObjectId válido de MongoDB
 */
export const generateObjectId = () => new Types.ObjectId();