// tests/unit/controllers/task.controller.test.ts
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
import taskRoutes from '../../../src/routes/task.routes';
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
  app.use('/api/tasks', taskRoutes);
  app.use(errorHandlerMiddleware);
  return app;
};

describe('Task Controller - Integration Tests', () => {
  let app: Application;
  let superadminToken: string;
  let agente1Token: string;
  let agente2Token: string;
  let superadminId: string;
  let agente1Id: string;
  let agente2Id: string;
  let property1Id: string; // Propiedad de agente1
  let property2Id: string; // Propiedad de agente2

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

  // Helper para crear usuarios, propiedades y obtener tokens
  const createTestUsersAndProperties = async () => {
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

    // Crear propiedades
    const property1 = await PropertyModel.create({
      title: 'Propiedad de Agente 1',
      description: 'Descripción',
      price: 100000,
      location: 'Cali',
      area: 100,
      owner: agente1Id
    });
    property1Id = property1._id.toString();

    const property2 = await PropertyModel.create({
      title: 'Propiedad de Agente 2',
      description: 'Descripción',
      price: 200000,
      location: 'Bogotá',
      area: 150,
      owner: agente2Id
    });
    property2Id = property2._id.toString();

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

  // ==================== RUTAS DE AGENTE ====================
  describe('GET /api/tasks/agent', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe obtener todas las tareas asignadas al agente (lista vacía)', async () => {
      const response = await request(app)
        .get('/api/tasks/agent')
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toBeDefined();
      expect(response.body.tasks).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('debe obtener solo las tareas asignadas al agente', async () => {
      // Crear tareas asignadas a agente1
      await TaskModel.create([
        {
          title: 'Tarea 1',
          description: 'Descripción 1',
          property: property1Id,
          assignedTo: agente1Id
        },
        {
          title: 'Tarea 2',
          description: 'Descripción 2',
          property: property1Id,
          assignedTo: agente1Id
        }
      ]);

      // Crear tarea asignada a agente2 (no debe aparecer)
      await TaskModel.create({
        title: 'Tarea de Agente 2',
        description: 'Descripción',
        property: property2Id,
        assignedTo: agente2Id
      });

      const response = await request(app)
        .get('/api/tasks/agent')
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.tasks.length).toBe(2);
      expect(response.body.tasks[0].assignedTo.id).toBe(agente1Id);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app).get('/api/tasks/agent');
      expect(response.status).toBe(401);
    });

    it('debe rechazar si un superadmin intenta usar ruta de agente', async () => {
      const response = await request(app)
        .get('/api/tasks/agent')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permisos');
    });
  });

  describe('GET /api/tasks/agent/:id', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe obtener una tarea asignada al agente', async () => {
      const task = await TaskModel.create({
        title: 'Tarea Test',
        description: 'Descripción test',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .get(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(task._id.toString());
      expect(response.body.title).toBe('Tarea Test');
      expect(response.body.assignedTo.id).toBe(agente1Id);
    });

    it('debe retornar 404 si la tarea no está asignada al agente', async () => {
      const task = await TaskModel.create({
        title: 'Tarea de Agente 2',
        description: 'Descripción',
        property: property2Id,
        assignedTo: agente2Id
      });

      const response = await request(app)
        .get(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Tarea no encontrada.');
    });

    it('debe retornar 404 si la tarea no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/agent/${fakeId}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar ID inválido', async () => {
      const response = await request(app)
        .get('/api/tasks/agent/invalid-id')
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks/property/:propertyId', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe obtener todas las tareas de una propiedad del agente', async () => {
      await TaskModel.create([
        {
          title: 'Tarea 1',
          description: 'Descripción 1',
          property: property1Id,
          assignedTo: agente1Id
        },
        {
          title: 'Tarea 2',
          description: 'Descripción 2',
          property: property1Id,
          assignedTo: agente1Id
        }
      ]);

      const response = await request(app)
        .get(`/api/tasks/property/${property1Id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.tasks.length).toBe(2);
    });

    it('debe retornar lista vacía si no hay tareas en la propiedad', async () => {
      const response = await request(app)
        .get(`/api/tasks/property/${property1Id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('debe retornar 404 si la propiedad no es del agente', async () => {
      const response = await request(app)
        .get(`/api/tasks/property/${property2Id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Propiedad no encontrada.');
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/property/${fakeId}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tasks/agent', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a un agente crear una tarea en su propiedad', async () => {
      const response = await request(app)
        .post('/api/tasks/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Nueva Tarea',
          description: 'Descripción de la tarea',
          property: property1Id
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Tarea creada exitosamente');
      expect(response.body.task.title).toBe('Nueva Tarea');
      expect(response.body.task.assignedTo.id).toBe(agente1Id);
    });

    it('debe asignar automáticamente la tarea al owner de la propiedad', async () => {
      const response = await request(app)
        .post('/api/tasks/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Tarea Auto-asignada',
          description: 'Descripción',
          property: property1Id
        });

      expect(response.status).toBe(201);
      
      // Verificar que assignedTo es el agente1
      const task = await TaskModel.findById(response.body.task.id);
      expect(task!.assignedTo.toString()).toBe(agente1Id);
    });

    it('debe rechazar si intenta crear tarea en propiedad que no le pertenece', async () => {
      const response = await request(app)
        .post('/api/tasks/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Tarea Inválida',
          description: 'Descripción',
          property: property2Id // Propiedad de agente2
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Propiedad no encontrada.');
    });

    it('debe rechazar creación sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/tasks/agent')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          // Falta title (campo requerido)
          description: 'Descripción sin título',
          property: property1Id
        });

      expect(response.status).toBe(400);
    });

    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/tasks/agent')
        .send({
          title: 'Tarea',
          description: 'Descripción',
          property: property1Id
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/tasks/agent/:id', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a un agente actualizar SU tarea', async () => {
      const task = await TaskModel.create({
        title: 'Tarea Original',
        description: 'Descripción original',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .put(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Tarea Actualizada',
          isCompleted: true
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Tarea actualizada exitosamente');
      expect(response.body.task.title).toBe('Tarea Actualizada');
      expect(response.body.task.isCompleted).toBe(true);
    });

    it('debe permitir marcar una tarea como completada', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id,
        isCompleted: false
      });

      const response = await request(app)
        .put(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          isCompleted: true
        });

      expect(response.status).toBe(200);
      expect(response.body.task.isCompleted).toBe(true);
    });

    it('debe rechazar si intenta actualizar tarea de otro agente', async () => {
      const task = await TaskModel.create({
        title: 'Tarea de Agente 2',
        description: 'Descripción',
        property: property2Id,
        assignedTo: agente2Id
      });

      const response = await request(app)
        .put(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Intento de actualización'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Tarea no encontrada.');
    });

    it('debe retornar 404 si la tarea no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/tasks/agent/${fakeId}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Actualización'
        });

      expect(response.status).toBe(404);
    });

    it('debe rechazar actualización sin datos', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .put(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se proporcionaron datos válidos para actualizar.');
    });
  });

  describe('DELETE /api/tasks/agent/:id', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a un agente eliminar SU tarea', async () => {
      const task = await TaskModel.create({
        title: 'Tarea a Eliminar',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .delete(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(204);

      // Verificar que la tarea ya no existe
      const deletedTask = await TaskModel.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('debe rechazar si intenta eliminar tarea de otro agente', async () => {
      const task = await TaskModel.create({
        title: 'Tarea de Agente 2',
        description: 'Descripción',
        property: property2Id,
        assignedTo: agente2Id
      });

      const response = await request(app)
        .delete(`/api/tasks/agent/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
    });

    it('debe retornar 404 si la tarea no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/tasks/agent/${fakeId}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar eliminación sin autenticación', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .delete(`/api/tasks/agent/${task._id}`);

      expect(response.status).toBe(401);
    });
  });

  // ==================== RUTAS DE ADMIN ====================
  describe('GET /api/tasks/admin', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a superadmin obtener todas las tareas del sistema', async () => {
      await TaskModel.create([
        {
          title: 'Tarea 1',
          description: 'Descripción 1',
          property: property1Id,
          assignedTo: agente1Id
        },
        {
          title: 'Tarea 2',
          description: 'Descripción 2',
          property: property2Id,
          assignedTo: agente2Id
        }
      ]);

      const response = await request(app)
        .get('/api/tasks/admin')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.tasks.length).toBe(2);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const response = await request(app)
        .get('/api/tasks/admin')
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permisos');
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app).get('/api/tasks/admin');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tasks/admin/:id', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a superadmin obtener cualquier tarea', async () => {
      const task = await TaskModel.create({
        title: 'Tarea Test',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .get(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(task._id.toString());
      expect(response.body.title).toBe('Tarea Test');
    });

    it('debe retornar 404 si la tarea no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/admin/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .get(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/tasks/admin/property/:propertyId', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a superadmin obtener tareas de cualquier propiedad', async () => {
      await TaskModel.create([
        {
          title: 'Tarea 1',
          description: 'Descripción 1',
          property: property1Id,
          assignedTo: agente1Id
        },
        {
          title: 'Tarea 2',
          description: 'Descripción 2',
          property: property1Id,
          assignedTo: agente1Id
        }
      ]);

      const response = await request(app)
        .get(`/api/tasks/admin/property/${property1Id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.tasks.length).toBe(2);
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/admin/property/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const response = await request(app)
        .get(`/api/tasks/admin/property/${property1Id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/tasks/admin', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a superadmin crear tarea en cualquier propiedad', async () => {
      const response = await request(app)
        .post('/api/tasks/admin')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Tarea por Admin',
          description: 'Descripción',
          property: property1Id
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Tarea creada exitosamente por el administrador');
      expect(response.body.task.title).toBe('Tarea por Admin');
    });

    it('debe asignar automáticamente la tarea al owner de la propiedad', async () => {
      const response = await request(app)
        .post('/api/tasks/admin')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Tarea',
          description: 'Descripción',
          property: property2Id // Propiedad de agente2
        });

      expect(response.status).toBe(201);
      
      // Verificar que assignedTo es el owner de la propiedad (agente2)
      const task = await TaskModel.findById(response.body.task.id);
      expect(task!.assignedTo.toString()).toBe(agente2Id);
    });

    it('debe retornar 404 si la propiedad no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/tasks/admin')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Tarea',
          description: 'Descripción',
          property: fakeId
        });

      expect(response.status).toBe(404);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const response = await request(app)
        .post('/api/tasks/admin')
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Intento',
          description: 'Descripción',
          property: property1Id
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/tasks/admin/:id', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a superadmin actualizar cualquier tarea', async () => {
      const task = await TaskModel.create({
        title: 'Tarea Original',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .put(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Tarea Actualizada por Admin',
          isCompleted: true
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Tarea actualizada exitosamente por el administrador');
      expect(response.body.task.title).toBe('Tarea Actualizada por Admin');
      expect(response.body.task.isCompleted).toBe(true);
    });

    it('debe recalcular assignedTo al cambiar la propiedad', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .put(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          property: property2Id // Cambiar a propiedad de agente2
        });

      expect(response.status).toBe(200);
      
      // Verificar que assignedTo cambió al owner de la nueva propiedad
      const updatedTask = await TaskModel.findById(task._id);
      expect(updatedTask!.assignedTo.toString()).toBe(agente2Id);
    });

    it('debe retornar 404 si la tarea no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/tasks/admin/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          title: 'Actualización'
        });

      expect(response.status).toBe(404);
    });

    it('debe rechazar actualización sin datos', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .put(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se proporcionaron datos válidos para actualizar.');
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .put(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`)
        .send({
          title: 'Intento'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/tasks/admin/:id', () => {
    beforeEach(async () => {
      await createTestUsersAndProperties();
    });

    it('debe permitir a superadmin eliminar cualquier tarea', async () => {
      const task = await TaskModel.create({
        title: 'Tarea a Eliminar',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .delete(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(204);

      // Verificar que la tarea ya no existe
      const deletedTask = await TaskModel.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('debe retornar 404 si la tarea no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/tasks/admin/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar si un agente intenta usar ruta de admin', async () => {
      const task = await TaskModel.create({
        title: 'Tarea',
        description: 'Descripción',
        property: property1Id,
        assignedTo: agente1Id
      });

      const response = await request(app)
        .delete(`/api/tasks/admin/${task._id}`)
        .set('Authorization', `Bearer ${agente1Token}`);

      expect(response.status).toBe(403);
    });
  });
});
