import { serializeProperty } from '../../../src/utils/property.serializer';
import { Types } from 'mongoose';

describe('Property Serializer', () => {
  describe('serializeProperty', () => {
    it('debe serializar una propiedad con owner poblado', () => {
      const mockProperty = {
        _id: new Types.ObjectId(),
        title: 'Casa Moderna',
        description: 'Hermosa casa en Cali',
        price: 300000,
        location: 'Cali, Colombia',
        bedrooms: 4,
        bathrooms: 3,
        area: 200,
        imageUrls: ['url1.jpg', 'url2.jpg'],
        owner: {
          _id: new Types.ObjectId(),
          name: 'Juan Propietario',
          email: 'juan@test.com',
          role: 'agente',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const result = serializeProperty(mockProperty);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Casa Moderna');
      expect(result.price).toBe(300000);
      expect(result.bedrooms).toBe(4);
      
      // Owner debe ser un objeto serializado
      expect(typeof result.owner).toBe('object');
      expect(result.owner).toHaveProperty('id');
      expect(result.owner).toHaveProperty('name', 'Juan Propietario');
    });

    it('debe serializar una propiedad con owner como ID string', () => {
      const ownerId = new Types.ObjectId();
      const mockProperty = {
        _id: new Types.ObjectId(),
        title: 'Apartamento',
        description: 'Apartamento céntrico',
        price: 150000,
        location: 'Bogotá',
        bedrooms: 2,
        bathrooms: 1,
        area: 80,
        imageUrls: [],
        owner: ownerId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = serializeProperty(mockProperty);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Apartamento');
      
      // Owner debe ser un string (ID)
      expect(typeof result.owner).toBe('string');
      expect(result.owner).toBe(ownerId.toString());
    });

    it('debe manejar imageUrls vacío correctamente', () => {
      const mockProperty = {
        _id: new Types.ObjectId(),
        title: 'Casa',
        description: 'Sin fotos',
        price: 100000,
        location: 'Cali',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        imageUrls: undefined,
        owner: new Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = serializeProperty(mockProperty);

      expect(result.imageUrls).toEqual([]);
      expect(Array.isArray(result.imageUrls)).toBe(true);
    });
  });
});