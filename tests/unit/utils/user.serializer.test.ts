import { serializeUser } from '../../../src/utils/user.serializer';
import { Types } from 'mongoose';

describe('User Serializer', () => {
  describe('serializeUser', () => {
    it('debe serializar un usuario correctamente', () => {
      // Arrange: Preparar datos de prueba
      const mockUser = {
        _id: new Types.ObjectId(),
        name: 'Juan Pérez',
        email: 'juan@test.com',
        password: 'hashed_password_123',
        role: 'agente',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      // Act: Ejecutar la función
      const result = serializeUser(mockUser);

      // Assert: Verificar resultados
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'Juan Pérez');
      expect(result).toHaveProperty('email', 'juan@test.com');
      expect(result).toHaveProperty('role', 'agente');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      
      // Verificar que NO incluye la contraseña
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('_id');
      
      // Verificar que el ID es un string
      expect(typeof result.id).toBe('string');
    });

    it('debe convertir ObjectId a string', () => {
      const objectId = new Types.ObjectId();
      const mockUser = {
        _id: objectId,
        name: 'Test',
        email: 'test@test.com',
        password: 'hash',
        role: 'agente',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = serializeUser(mockUser);

      expect(result.id).toBe(objectId.toString());
      expect(typeof result.id).toBe('string');
    });

    it('debe manejar fechas correctamente', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T15:30:00Z');
      
      const mockUser = {
        _id: new Types.ObjectId(),
        name: 'Test',
        email: 'test@test.com',
        password: 'hash',
        role: 'superadmin',
        createdAt,
        updatedAt,
      };

      const result = serializeUser(mockUser);

      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);
    });

    it('debe omitir la contraseña del resultado', () => {
      const mockUser = {
        _id: new Types.ObjectId(),
        name: 'Test',
        email: 'test@test.com',
        password: 'super_secret_password_hash',
        role: 'agente',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = serializeUser(mockUser);

      expect(result).not.toHaveProperty('password');
      expect(Object.keys(result)).not.toContain('password');
    });
  });
});