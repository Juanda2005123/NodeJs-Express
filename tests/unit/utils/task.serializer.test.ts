// tests/unit/utils/task.serializer.test.ts
import { serializeTask } from '../../../src/utils/task.serializer';
import { Types } from 'mongoose';

describe('Task Serializer', () => {
  describe('serializeTask', () => {
    it('debe serializar una tarea completa con relaciones pobladas', () => {
      const mockTask = {
        _id: new Types.ObjectId(),
        title: 'Reparar techo',
        description: 'Arreglar goteras del techo',
        isCompleted: false,
        property: {
          _id: new Types.ObjectId(),
          title: 'Casa Principal',
          description: 'Casa para arrendar',
          price: 250000,
          location: 'Cali',
          bedrooms: 3,
          bathrooms: 2,
          area: 150,
          imageUrls: [],
          owner: new Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        assignedTo: {
          _id: new Types.ObjectId(),
          name: 'Carlos Agente',
          email: 'carlos@test.com',
          role: 'agente',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const result = serializeTask(mockTask);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Reparar techo');
      expect(result.isCompleted).toBe(false);
      
      // Property debe ser un objeto serializado
      expect(typeof result.property).toBe('object');
      expect(result.property).toHaveProperty('id');
      expect(result.property.title).toBe('Casa Principal');
      
      // AssignedTo debe ser un objeto serializado
      expect(typeof result.assignedTo).toBe('object');
      expect(result.assignedTo).toHaveProperty('id');
      expect(result.assignedTo.name).toBe('Carlos Agente');
      expect(result.assignedTo).not.toHaveProperty('password');
    });

    it('debe marcar correctamente tareas completadas', () => {
      const mockTask = {
        _id: new Types.ObjectId(),
        title: 'Tarea Completada',
        description: 'Esta ya está hecha',
        isCompleted: true,
        property: {
          _id: new Types.ObjectId(),
          title: 'Propiedad',
          description: 'Desc',
          price: 100000,
          location: 'Loc',
          bedrooms: 2,
          bathrooms: 1,
          area: 80,
          imageUrls: [],
          owner: new Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        assignedTo: {
          _id: new Types.ObjectId(),
          name: 'Agente',
          email: 'agente@test.com',
          role: 'agente',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = serializeTask(mockTask);

      expect(result.isCompleted).toBe(true);
    });
  });
});