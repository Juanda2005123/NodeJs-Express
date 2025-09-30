// tests/unit/services/user.service.test.ts
import {
  registerUserService,
  loginUserService,
  createUserService,
  getUserByIdService,
  getAllUsersService,
  updateUserProfileService,
  updateUserByAdminService,
  deleteUserByIdService,
} from '../../../src/services/user.service';
import UserModel from '../../../src/models/User.model';
import PropertyModel from '../../../src/models/Property.model';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/db.helper';
import { userFactory } from '../../helpers/factories';
import * as bcrypt from 'bcrypt';

describe('User Service', () => {
  // Setup antes de todas las pruebas
  beforeAll(async () => {
    await connectTestDB();
  });

  // Limpiar después de cada prueba
  afterEach(async () => {
    await clearTestDB();
  });

  // Desconexión final
  afterAll(async () => {
    await disconnectTestDB();
  });

  // ==================== REGISTER USER ====================
  describe('registerUserService', () => {
    it('debe registrar un nuevo usuario con rol agente por defecto', async () => {
      const userData = userFactory.agent({ email: 'nuevo@test.com' });

      const user = await registerUserService(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe('nuevo@test.com');
      expect(user.role).toBe('agente');
      expect(user.password).not.toBe(userData.password);
    });

    it('debe hashear la contraseña correctamente', async () => {
      const userData = userFactory.agent({ password: 'password123' });

      const user = await registerUserService(userData);

      expect(user.password).not.toBe('password123');
      const isPasswordValid = await bcrypt.compare('password123', user.password);
      expect(isPasswordValid).toBe(true);
    });

    it('debe fallar al registrar con email duplicado', async () => {
      const userData = userFactory.agent({ email: 'duplicado@test.com' });

      await registerUserService(userData);

      await expect(
        registerUserService({ ...userData, email: 'duplicado@test.com' })
      ).rejects.toThrow();
    });

    it('debe convertir email a minúsculas', async () => {
      const userData = userFactory.agent({ email: 'MAYUSCULAS@TEST.COM' });

      const user = await registerUserService(userData);

      expect(user.email).toBe('mayusculas@test.com');
    });
  });

  // ==================== LOGIN USER ====================
  describe('loginUserService', () => {
    it('debe autenticar usuario con credenciales válidas', async () => {
      const userData = userFactory.agent({ 
        email: 'login@test.com', 
        password: 'password123' 
      });
      await registerUserService(userData);

      const result = await loginUserService('login@test.com', 'password123');

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@test.com');
    });

    it('debe fallar con email inexistente', async () => {
      await expect(
        loginUserService('noexiste@test.com', 'password123')
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe fallar con contraseña incorrecta', async () => {
      const userData = userFactory.agent({ 
        email: 'test@test.com', 
        password: 'correcta' 
      });
      await registerUserService(userData);

      await expect(
        loginUserService('test@test.com', 'incorrecta')
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe funcionar con mayúsculas en el email', async () => {
      const userData = userFactory.agent({ 
        email: 'case@test.com', 
        password: 'password123' 
      });
      await registerUserService(userData);

      const result = await loginUserService('CASE@TEST.COM', 'password123');

      expect(result).toBeDefined();
      expect(result.user.email).toBe('case@test.com');
    });
  });

  // ==================== CREATE USER (Admin) ====================
  describe('createUserService', () => {
    it('debe crear usuario con rol especificado (superadmin)', async () => {
      const userData = userFactory.superadmin();

      const user = await createUserService(userData);

      expect(user).toBeDefined();
      expect(user.role).toBe('superadmin');
      expect(user.email).toBe(userData.email);
    });

    it('debe crear usuario con rol agente', async () => {
      const userData = userFactory.agent();

      const user = await createUserService(userData);

      expect(user.role).toBe('agente');
    });

    it('debe fallar con email duplicado', async () => {
      const userData = userFactory.agent({ email: 'dup@test.com' });
      await createUserService(userData);

      await expect(
        createUserService({ ...userData, email: 'dup@test.com' })
      ).rejects.toThrow();
    });
  });

  // ==================== GET USER BY ID ====================
  describe('getUserByIdService', () => {
    it('debe obtener usuario por ID válido', async () => {
      const userData = userFactory.agent();
      const createdUser = await registerUserService(userData);

      const user = await getUserByIdService(createdUser._id.toString());

      expect(user).toBeDefined();
      expect(user!._id.toString()).toBe(createdUser._id.toString());
      expect(user!.email).toBe(createdUser.email);
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const user = await getUserByIdService(fakeId);

      expect(user).toBeNull();
    });

    it('debe fallar con ID inválido', async () => {
      await expect(getUserByIdService('id-invalido')).rejects.toThrow();
    });
  });

  // ==================== GET ALL USERS ====================
  describe('getAllUsersService', () => {
    it('debe obtener todos los usuarios', async () => {
      await registerUserService(userFactory.agent({ email: 'user1@test.com' }));
      await registerUserService(userFactory.agent({ email: 'user2@test.com' }));
      await createUserService(userFactory.superadmin({ email: 'admin@test.com' }));

      const users = await getAllUsersService();

      expect(users).toHaveLength(3);
      expect(users[0]).toBeDefined();
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('role');
      // Verificar que password no está definido (porque se usó select('-password'))
      expect(users[0]!.password).toBeUndefined();
    });

    it('debe retornar array vacío si no hay usuarios', async () => {
      const users = await getAllUsersService();

      expect(users).toEqual([]);
      expect(Array.isArray(users)).toBe(true);
    });
  });

  // ==================== UPDATE USER PROFILE ====================
  describe('updateUserProfileService', () => {
    it('debe actualizar nombre del usuario', async () => {
      const userData = userFactory.agent();
      const user = await registerUserService(userData);

      const updated = await updateUserProfileService(user._id.toString(), {
        name: 'Nuevo Nombre',
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Nuevo Nombre');
      expect(updated!.email).toBe(user.email);
    });

    it('debe actualizar email del usuario', async () => {
      const userData = userFactory.agent();
      const user = await registerUserService(userData);

      const updated = await updateUserProfileService(user._id.toString(), {
        email: 'nuevoemail@test.com',
      });

      expect(updated!.email).toBe('nuevoemail@test.com');
    });

    it('debe actualizar y hashear nueva contraseña', async () => {
      const userData = userFactory.agent({ password: 'vieja123' });
      const user = await registerUserService(userData);

      const updated = await updateUserProfileService(user._id.toString(), {
        password: 'nueva456',
      });

      expect(updated).toBeDefined();
      // El servicio retorna sin password, así que buscamos el usuario completo para verificar
      const userWithPassword = await UserModel.findById(user._id);
      expect(userWithPassword).toBeDefined();
      expect(userWithPassword!.password).not.toBe('nueva456');
      const isValid = await bcrypt.compare('nueva456', userWithPassword!.password);
      expect(isValid).toBe(true);
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const updated = await updateUserProfileService(fakeId, { name: 'Test' });

      expect(updated).toBeNull();
    });
  });

  // ==================== UPDATE USER BY ADMIN ====================
  describe('updateUserByAdminService', () => {
    it('debe permitir cambiar el rol del usuario', async () => {
      const userData = userFactory.agent();
      const user = await registerUserService(userData);

      const updated = await updateUserByAdminService(user._id.toString(), {
        role: 'superadmin',
      });

      expect(updated).toBeDefined();
      expect(updated!.role).toBe('superadmin');
    });

    it('debe actualizar múltiples campos a la vez', async () => {
      const userData = userFactory.agent();
      const user = await registerUserService(userData);

      const updated = await updateUserByAdminService(user._id.toString(), {
        name: 'Admin Actualizado',
        email: 'adminupdate@test.com',
        role: 'superadmin',
      });

      expect(updated!.name).toBe('Admin Actualizado');
      expect(updated!.email).toBe('adminupdate@test.com');
      expect(updated!.role).toBe('superadmin');
    });
  });

  // ==================== DELETE USER ====================
  describe('deleteUserByIdService', () => {
    it('debe eliminar usuario sin propiedades', async () => {
      const userData = userFactory.agent();
      const user = await registerUserService(userData);

      const deleted = await deleteUserByIdService(user._id.toString());

      expect(deleted).toBeDefined();
      expect(deleted!._id.toString()).toBe(user._id.toString());

      // Verificar que ya no existe
      const found = await getUserByIdService(user._id.toString());
      expect(found).toBeNull();
    });

    it('debe fallar al eliminar usuario con propiedades asignadas', async () => {
      const userData = userFactory.agent();
      const user = await registerUserService(userData);

      // Crear una propiedad asignada al usuario
      await PropertyModel.create({
        title: 'Casa',
        description: 'Casa de prueba',
        price: 100000,
        location: 'Cali',
        bedrooms: 3,
        bathrooms: 2,
        area: 150,
        owner: user._id,
      });

      await expect(deleteUserByIdService(user._id.toString())).rejects.toThrow(
        'No se puede eliminar el usuario: tiene propiedades asignadas'
      );
    });

    it('debe retornar null al eliminar usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const deleted = await deleteUserByIdService(fakeId);

      expect(deleted).toBeNull();
    });
  });
});