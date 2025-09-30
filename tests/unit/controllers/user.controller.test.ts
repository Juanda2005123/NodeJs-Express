// tests/integration/controllers/user.controller.test.ts
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
import userRoutes from '../../../src/routes/user.routes';
import { errorHandlerMiddleware } from '../../../src/middlewares/errorHandler.middleware';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/db.helper';
import UserModel from '../../../src/models/User.model';
import PropertyModel from '../../../src/models/Property.model';

// Crear app Express para testing
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  app.use(errorHandlerMiddleware);
  return app;
};

describe('User Controller - Integration Tests', () => {
  let app: Application;
  let superadminToken: string;
  let agenteToken: string;
  let superadminId: string;
  let agenteId: string;

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

  // Helper para crear usuarios de prueba
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

    // Crear agente
    const agente = new UserModel({
      name: 'Agente Test',
      email: 'agente@test.com',
      password: 'agente123',
      role: 'agente'
    });
    await agente.save();
    agenteId = agente._id.toString();

    // Obtener tokens
    const superadminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    superadminToken = superadminLogin.body.token;

    const agenteLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'agente@test.com', password: 'agente123' });
    agenteToken = agenteLogin.body.token;
  };

  // ==================== RUTAS PÚBLICAS ====================
  describe('POST /api/users/register', () => {
    it('debe registrar un nuevo usuario con rol agente', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Juan Pérez',
          email: 'juan@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('juan@test.com');
      expect(response.body.user.name).toBe('Juan Pérez');
      expect(response.body.user.role).toBe('agente');
      expect(response.body.user.password).toBeUndefined();
    });

    it('debe rechazar registro con email duplicado', async () => {
      await UserModel.create({
        name: 'Usuario Existente',
        email: 'duplicado@test.com',
        password: 'password123',
        role: 'agente'
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Nuevo Usuario',
          email: 'duplicado@test.com',
          password: 'password456'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('email');
    });

    it('debe rechazar registro sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User'
          // Faltan email y password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await UserModel.create({
        name: 'Login Test',
        email: 'login@test.com',
        password: 'password123',
        role: 'agente'
      });
    });

    it('debe autenticar usuario con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('login@test.com');
      expect(response.body.user.password).toBeUndefined();
    });

    it('debe rechazar login con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('debe rechazar login con email no registrado', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'noexiste@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('debe rechazar login sin email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('El email y la contraseña son requeridos.');
    });

    it('debe rechazar login sin contraseña', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('El email y la contraseña son requeridos.');
    });
  });

  // ==================== RUTAS DE PERFIL (/me) ====================
  describe('GET /api/users/me', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe obtener el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('agente@test.com');
      expect(response.body.name).toBe('Agente Test');
      expect(response.body.role).toBe('agente');
      expect(response.body.password).toBeUndefined();
    });

    it('debe rechazar petición sin token', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('token');
    });

    it('debe rechazar petición con token inválido', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe actualizar el nombre del usuario', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'Nombre Actualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Perfil actualizado exitosamente');
      expect(response.body.user.name).toBe('Nombre Actualizado');
      expect(response.body.user.email).toBe('agente@test.com');
    });

    it('debe actualizar el email del usuario', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          email: 'nuevoemail@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('nuevoemail@test.com');
    });

    it('debe actualizar la contraseña del usuario', async () => {
      const updateResponse = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          password: 'newpassword123'
        });

      expect(updateResponse.status).toBe(200);

      // Verificar que puede hacer login con la nueva contraseña
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'agente@test.com',
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
    });

    it('debe actualizar múltiples campos a la vez', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'Nuevo Nombre',
          email: 'nuevoemail@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Nuevo Nombre');
      expect(response.body.user.email).toBe('nuevoemail@test.com');
    });

    it('debe rechazar actualización sin datos', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se proporcionaron datos válidos para actualizar.');
    });

    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({
          name: 'Nuevo Nombre'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/me', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe eliminar la cuenta del usuario autenticado', async () => {
      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).toBe(204);

      // Verificar que el usuario ya no existe
      const user = await UserModel.findById(agenteId);
      expect(user).toBeNull();
    });

    it('debe rechazar eliminación si el usuario tiene propiedades', async () => {
      // Crear una propiedad para el agente
      await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Location',
        area: 100, 
        owner: agenteId
      });

      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('propiedades');
    });

    it('debe rechazar eliminación sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/users/me');

      expect(response.status).toBe(401);
    });
  });

  // ==================== RUTAS DE ADMINISTRACIÓN ====================
  describe('POST /api/users (Admin)', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin crear usuario con rol agente', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Nuevo Agente',
          email: 'nuevoagente@test.com',
          password: 'password123',
          role: 'agente'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuario creado exitosamente por el administrador');
      expect(response.body.user.email).toBe('nuevoagente@test.com');
      expect(response.body.user.role).toBe('agente');
    });

    it('debe permitir a superadmin crear otro superadmin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Otro Admin',
          email: 'otroadmin@test.com',
          password: 'password123',
          role: 'superadmin'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('superadmin');
    });

    it('debe rechazar si un agente intenta crear usuario', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'Intento Agente',
          email: 'intento@test.com',
          password: 'password123',
          role: 'agente'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permisos');
    });

    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: 'password123',
          role: 'agente'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users (Admin)', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin obtener todos los usuarios', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(response.body.total).toBe(2);
      expect(response.body.users.length).toBe(2);
      expect(response.body.users[0].password).toBeUndefined();
    });

    it('debe rechazar si un agente intenta obtener todos los usuarios', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permisos');
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id (Admin)', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin obtener usuario por ID', async () => {
      const response = await request(app)
        .get(`/api/users/${agenteId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('agente@test.com');
      expect(response.body.name).toBe('Agente Test');
      expect(response.body.password).toBeUndefined();
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Usuario no encontrado.');
    });

    it('debe rechazar si un agente intenta obtener otro usuario', async () => {
      const response = await request(app)
        .get(`/api/users/${superadminId}`)
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).toBe(403);
    });

    it('debe rechazar ID inválido', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('formato');
    });
  });

  describe('PUT /api/users/:id (Admin)', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin actualizar cualquier usuario', async () => {
      const response = await request(app)
        .put(`/api/users/${agenteId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Nombre Actualizado por Admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Usuario actualizado exitosamente por el administrador');
      expect(response.body.user.name).toBe('Nombre Actualizado por Admin');
    });

    it('debe permitir a superadmin cambiar el rol de un usuario', async () => {
      const response = await request(app)
        .put(`/api/users/${agenteId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          role: 'superadmin'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('superadmin');
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Test'
        });

      expect(response.status).toBe(404);
    });

    it('debe rechazar si un agente intenta actualizar otro usuario', async () => {
      const response = await request(app)
        .put(`/api/users/${superadminId}`)
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'Intento'
        });

      expect(response.status).toBe(403);
    });

    it('debe rechazar actualización sin datos', async () => {
      const response = await request(app)
        .put(`/api/users/${agenteId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se proporcionaron datos válidos para actualizar.');
    });
  });

  describe('DELETE /api/users/:id (Admin)', () => {
    beforeEach(async () => {
      await createTestUsers();
    });

    it('debe permitir a superadmin eliminar cualquier usuario', async () => {
      const response = await request(app)
        .delete(`/api/users/${agenteId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(204);

      // Verificar que el usuario ya no existe
      const user = await UserModel.findById(agenteId);
      expect(user).toBeNull();
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(404);
    });

    it('debe rechazar eliminación si el usuario tiene propiedades', async () => {
      await PropertyModel.create({
        title: 'Casa Test',
        description: 'Descripción',
        price: 100000,
        location: 'Location',
        area: 100,
        owner: agenteId
      });

      const response = await request(app)
        .delete(`/api/users/${agenteId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('propiedades');
    });

    it('debe rechazar si un agente intenta eliminar otro usuario', async () => {
      const response = await request(app)
        .delete(`/api/users/${superadminId}`)
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).toBe(403);
    });
  });
});