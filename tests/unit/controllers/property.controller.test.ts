// tests/unit/controllers/property.controller.test.ts
// Mock dotenv ANTES de cualquier import
jest.mock('dotenv', () => ({
  __esModule: true,
  default: {
    config: jest.fn(),
  },
  config: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
import { Application } from 'express';
import propertyRoutes from '../../../src/routes/property.routes';
import userRoutes from '../../../src/routes/user.routes';
import { errorHandlerMiddleware } from '../../../src/middlewares/errorHandler.middleware';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/db.helper';
import UserModel from '../../../src/models/User.model';
import PropertyModel from '../../../src/models/Property.model';
import TaskModel from '../../../src/models/Task.model';

// Crear app Express para testing
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use(errorHandlerMiddleware);
  return app;
};

describe('Property Controller - Integration Tests', () => {
  let app: Application;
  let superadminToken: string;
  let agente1Token: string;
  let agente2Token: string;
  let superadminId: string;
  let agente1Id: string;
  let agente2Id: string;

  beforeAll(async () => {
    await connectTestDB();
    app = createTestApp();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  // Helper para crear usuarios de prueba y obtener tokens
  const createTestUsers = async () => {
    // Crear superadmin
    const superadmin = new UserModel({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'superadmin'
    });
    await superadmin.save();
    superadminId = superadmin._id.toString();

    // Crear agente 1
    const agente1 = new UserModel({
      name: 'Agente 1',
      email: 'agente1@test.com',
      password: 'agente123',
      role: 'agente'
    });
    await agente1.save();
    agente1Id = agente1._id.toString();

    // Crear agente 2
    const agente2 = new UserModel({
      name: 'Agente 2',
      email: 'agente2@test.com',
      password: 'agente123',
      role: 'agente'
    });
    await agente2.save();
    agente2Id = agente2._id.toString();

    // Obtener tokens
    const superadminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    superadminToken = superadminLogin.body.token;

    const agente1Login = await request(app)
      .post('/api/users/login')
      .send({ email: 'agente1@test.com', password: 'agente123' });
    agente1Token = agente1Login.body.token;

    const agente2Login = await request(app)
      .post('/api/users/login')
      .send({ email: 'agente2@test.com', password: 'agente123' });
    agente2Token = agente2Login.body.token;
  };

  // ==================== RUTAS PÚBLICAS ====================
  describe('GET /api/properties', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe obtener todas las propiedades (lista vacía)', async () => {
      const response = await request(app).get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body.properties).toBeDefined();
      expect(response.body.properties).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('debe obtener todas las propiedades con datos', async () => {
      // Crear algunas propiedades
      await PropertyModel.create([
        {
          title: 'Casa 1',
          description: 'Descripción 1',
          price: 100000,
          location: 'Cali',
          area: 100,
          owner: agente1Id
        },
        {
          title: 'Casa 2',
          description: 'Descripción 2',
          price: 200000,
          location: 'Bogotá',
          area: 150,
          owner: agente2Id
        }
      ]);

      const response = await request(app).get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.properties.length).toBe(2);
      expect(response.body.properties[0].title).toBeDefined();
      expect(response.body.properties[0].owner).toBeDefined();
    });
  });

  describe('GET /api/properties/:id', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe obtener una propiedad por ID', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción test',
        price: 150000,
        location: 'Medellín',
        area: 120,
        owner: agente1Id
      });

      const response = await request(app).get(`/api/properties/${property._id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(property._id.toString());
      expect(response.body.title).toBe('Casa Test');
      expect(response.body.price).toBe(150000);
      expect(response.body.owner).toBeDefined();
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/properties/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Propiedad no encontrada.');
    });

    it('debe rechazar ID inválido', async () => {
      const response = await request(app).get('/api/properties/invalid-id');

      expect(response.status).toBe(400);
    });
  });

  // ==================== RUTAS PRIVADAS PARA AGENTES ====================
  describe('POST /api/properties/agent', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a un agente crear una propiedad', async () => {
      const response = await request(app)
        .post('/api/properties/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Nueva Casa',
          description: 'Casa hermosa',
          price: 300000,
          location: 'Cartagena',
          bedrooms: 3,
          bathrooms: 2,
          area: 180,
          imageUrls: ['https://example.com/image1.jpg']
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Propiedad creada exitosamente');
      expect(response.body.property.title).toBe('Nueva Casa');
      expect(response.body.property.price).toBe(300000);
      expect(response.body.property.owner).toBeDefined();
    });

    it('debe asignar automáticamente el agente como owner', async () => {
      const response = await request(app)
        .post('/api/properties/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Casa Agente',
          description: 'Descripción',
          price: 250000,
          location: 'Cali',
          area: 150
        });

      expect(response.status).toBe(201);
      
      // Verificar que el owner es el agente1
      const property = await PropertyModel.findById(response.body.property.id);
      expect(property!.owner.toString()).toBe(agente1Id);
    });

    it('debe rechazar creación sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/properties/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Casa sin datos'
          // Faltan campos requeridos
        });

      expect(response.status).toBe(400);
    });

    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/properties/agent')
        .send({
          title: 'Casa Test',
          description: 'Descripción',
          price: 100000,
          location: 'Cali',
          area: 100
        });

      expect(response.status).toBe(401);
    });

    it('debe rechazar si un superadmin intenta usar ruta de agente', async () => {
      const response = await request(app)
        .post('/api/properties/agent')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Casa Test',
          description: 'Descripción',
          price: 100000,
          location: 'Cali',
          area: 100
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permisos');
    });
  });

  describe('PUT /api/properties/agent/:id', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a un agente actualizar SU propiedad', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Original',
        description: 'Descripción original',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .put(`/api/properties/agent/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Casa Actualizada',
          price: 150000
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Propiedad actualizada exitosamente');
      expect(response.body.property.title).toBe('Casa Actualizada');
      expect(response.body.property.price).toBe(150000);
    });

    it('debe rechazar si un agente intenta actualizar propiedad de otro agente', async () => {
      const property = await PropertyModel.create({
        title: 'Casa de Agente 2',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente2Id
      });

      const response = await request(app)
        .put(`/api/properties/agent/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Intento de actualización'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Propiedad no encontrada.');
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/properties/agent/${fakeId}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Actualización'
        });

      expect(response.status).toBe(404);
    });

    it('debe rechazar actualización sin datos', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .put(`/api/properties/agent/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se proporcionaron datos válidos para actualizar.');
    });

    it('debe rechazar actualización sin autenticación', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .put(`/api/properties/agent/${property._id}`)
        .send({
          title: 'Actualización'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/properties/agent/:id', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a un agente eliminar SU propiedad', async () => {
      const property = await PropertyModel.create({
        title: 'Casa a Eliminar',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .delete(`/api/properties/agent/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(204);

      // Verificar que la propiedad ya no existe
      const deletedProperty = await PropertyModel.findById(property._id);
      expect(deletedProperty).toBeNull();
    });

    it('debe eliminar en cascada las tareas asociadas', async () => {
      const property = await PropertyModel.create({
        title: 'Casa con Tareas',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      // Crear tareas asociadas a la propiedad
      await TaskModel.create([
        {
          title: 'Tarea 1',
          description: 'Descripción 1',
          property: property._id,
          assignedTo: agente1Id
        },
        {
          title: 'Tarea 2',
          description: 'Descripción 2',
          property: property._id,
          assignedTo: agente1Id
        }
      ]);

      const response = await request(app)
        .delete(`/api/properties/agent/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(204);

      // Verificar que las tareas también fueron eliminadas
      const tasks = await TaskModel.find({ property: property._id });
      expect(tasks.length).toBe(0);
    });

    it('debe rechazar si un agente intenta eliminar propiedad de otro agente', async () => {
      const property = await PropertyModel.create({
        title: 'Casa de Agente 2',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente2Id
      });

      const response = await request(app)
        .delete(`/api/properties/agent/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/properties/agent/${fakeId}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar eliminación sin autenticación', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .delete(`/api/properties/agent/${property._id}`);

      expect(response.status).toBe(401);
    });
  });

  // ==================== RUTAS DE ADMINISTRACIÓN ====================
  describe('POST /api/properties/admin', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin crear propiedad con owner específico', async () => {
      const response = await request(app)
        .post('/api/properties/admin')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Casa por Admin',
          description: 'Descripción',
          price: 200000,
          location: 'Bogotá',
          area: 200,
          owner: agente1Id
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Propiedad creada exitosamente por el administrador');
      expect(response.body.property.title).toBe('Casa por Admin');
      
      // Verificar que el owner es el especificado
      const property = await PropertyModel.findById(response.body.property.id);
      expect(property!.owner.toString()).toBe(agente1Id);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const response = await request(app)
        .post('/api/properties/admin')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Intento',
          description: 'Descripción',
          price: 100000,
          location: 'Cali',
          area: 100,
          owner: agente1Id
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permisos');
    });

    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/properties/admin')
        .send({
          title: 'Casa Test',
          description: 'Descripción',
          price: 100000,
          location: 'Cali',
          area: 100,
          owner: agente1Id
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/properties/admin/:id', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin actualizar cualquier propiedad', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Original',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .put(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Casa Actualizada por Admin',
          price: 250000
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Propiedad actualizada exitosamente por el administrador');
      expect(response.body.property.title).toBe('Casa Actualizada por Admin');
      expect(response.body.property.price).toBe(250000);
    });

    it('debe permitir a superadmin cambiar el owner de una propiedad', async () => {
      const property = await PropertyModel.create({
        title: 'Casa de Agente 1',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .put(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          owner: agente2Id
        });

      expect(response.status).toBe(200);
      
      // Verificar que el owner cambió
      const updatedProperty = await PropertyModel.findById(property._id);
      expect(updatedProperty!.owner.toString()).toBe(agente2Id);
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/properties/admin/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Actualización'
        });

      expect(response.status).toBe(404);
    });

    it('debe rechazar actualización sin datos', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .put(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se proporcionaron datos válidos para actualizar.');
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente2Id
      });

      const response = await request(app)
        .put(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Intento'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/properties/admin/:id', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin eliminar cualquier propiedad', async () => {
      const property = await PropertyModel.create({
        title: 'Casa a Eliminar',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      const response = await request(app)
        .delete(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(204);

      // Verificar que la propiedad ya no existe
      const deletedProperty = await PropertyModel.findById(property._id);
      expect(deletedProperty).toBeNull();
    });

    it('debe eliminar en cascada las tareas asociadas (admin)', async () => {
      const property = await PropertyModel.create({
        title: 'Casa con Tareas',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente1Id
      });

      // Crear tareas asociadas
      await TaskModel.create({
        title: 'Tarea Test',
        description: 'Descripción',
        property: property._id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .delete(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(204);

      // Verificar que las tareas también fueron eliminadas
      const tasks = await TaskModel.find({ property: property._id });
      expect(tasks.length).toBe(0);
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/properties/admin/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const property = await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Cali',
        area: 100,
        owner: agente2Id
      });

      const response = await request(app)
        .delete(`/api/properties/admin/${property._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(403);
    });
  });
});
