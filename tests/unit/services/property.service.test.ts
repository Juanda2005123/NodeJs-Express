// tests/unit/services/property.service.test.ts
import {
    createPropertyByAgentService,
    createPropertyByAdminService,
    updatePropertyByAgentService,
    updatePropertyByAdminService,
    deletePropertyByAgentService,
    deletePropertyByAdminService,
    getAllPropertiesService,
    getPropertyByIdService,
  } from '../../../src/services/property.service';
  import PropertyModel from '../../../src/models/Property.model';
  import TaskModel from '../../../src/models/Task.model';
  import UserModel from '../../../src/models/User.model';
  import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/db.helper';
  import { userFactory } from '../../helpers/factories';
  import { registerUserService } from '../../../src/services/user.service';
  
  describe('Property Service', () => {
    let agentUser: any;
    let anotherAgentUser: any;
    let adminUser: any;
  
    // Setup antes de todas las pruebas
    beforeAll(async () => {
      await connectTestDB();
    });
  
    // Crear usuarios antes de cada prueba
    beforeEach(async () => {
      agentUser = await registerUserService(userFactory.agent({ email: 'agent@test.com' }));
      anotherAgentUser = await registerUserService(userFactory.agent({ email: 'agent2@test.com' }));
      adminUser = await UserModel.create({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'hashedpassword',
        role: 'superadmin',
      });
    });
  
    // Limpiar después de cada prueba
    afterEach(async () => {
      await clearTestDB();
    });
  
    // Desconexión final
    afterAll(async () => {
      await disconnectTestDB();
    });
  
    // ==================== CREATE PROPERTY BY AGENT ====================
    describe('createPropertyByAgentService', () => {
      it('debe crear una propiedad asignándola al agente', async () => {
        const propertyData = {
          title: 'Casa en Venta',
          description: 'Hermosa casa',
          price: 200000,
          location: 'Cali',
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          imageUrls: [],
        };
  
        const property = await createPropertyByAgentService(propertyData, agentUser._id.toString());
  
        expect(property).toBeDefined();
        expect(property.title).toBe('Casa en Venta');
        expect(property.owner.toString()).toBe(agentUser._id.toString());
        expect(property.price).toBe(200000);
      });
  
      it('debe crear propiedad con imágenes', async () => {
        const propertyData = {
          title: 'Apartamento',
          description: 'Apartamento moderno',
          price: 150000,
          location: 'Bogotá',
          bedrooms: 2,
          bathrooms: 1,
          area: 80,
          imageUrls: ['http://image1.jpg', 'http://image2.jpg'],
        };
  
        const property = await createPropertyByAgentService(propertyData, agentUser._id.toString());
  
        expect(property.imageUrls).toHaveLength(2);
        expect(property.imageUrls![0]).toBe('http://image1.jpg');
    });
  
      it('debe fallar si faltan campos requeridos', async () => {
        const invalidData: any = {
          title: 'Casa Incompleta',
          // Faltan campos requeridos
        };
  
        await expect(
          createPropertyByAgentService(invalidData, agentUser._id.toString())
        ).rejects.toThrow();
      });
    });
  
    // ==================== CREATE PROPERTY BY ADMIN ====================
    describe('createPropertyByAdminService', () => {
      it('debe crear propiedad con owner especificado', async () => {
        const propertyData = {
          title: 'Casa Admin',
          description: 'Propiedad creada por admin',
          price: 300000,
          location: 'Medellín',
          bedrooms: 4,
          bathrooms: 3,
          area: 200,
          imageUrls: [],
          owner: agentUser._id.toString(),
        };
  
        const property = await createPropertyByAdminService(propertyData);
  
        expect(property).toBeDefined();
        expect(property.title).toBe('Casa Admin');
        expect(property.owner.toString()).toBe(agentUser._id.toString());
      });
  
      it('debe crear propiedad asignada a cualquier agente', async () => {
        const propertyData = {
          title: 'Propiedad Reasignada',
          description: 'Asignada a otro agente',
          price: 250000,
          location: 'Cartagena',
          bedrooms: 3,
          bathrooms: 2,
          area: 150,
          imageUrls: [],
          owner: anotherAgentUser._id.toString(),
        };
  
        const property = await createPropertyByAdminService(propertyData);
  
        expect(property.owner.toString()).toBe(anotherAgentUser._id.toString());
      });
    });
  
    // ==================== UPDATE PROPERTY BY AGENT ====================
    describe('updatePropertyByAgentService', () => {
      it('debe actualizar su propia propiedad', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa Original',
            description: 'Descripción original',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const updated = await updatePropertyByAgentService(
          property._id.toString(),
          { title: 'Casa Actualizada', price: 120000 },
          agentUser._id.toString()
        );
  
        expect(updated).toBeDefined();
        expect(updated!.title).toBe('Casa Actualizada');
        expect(updated!.price).toBe(120000);
      });
  
      it('NO debe actualizar propiedad de otro agente', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa del Agente 1',
            description: 'Propiedad privada',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        // Otro agente intenta actualizar
        const updated = await updatePropertyByAgentService(
          property._id.toString(),
          { title: 'Intento de Actualización' },
          anotherAgentUser._id.toString()
        );
  
        expect(updated).toBeNull();
      });
  
      it('debe retornar null con ID inexistente', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
  
        const updated = await updatePropertyByAgentService(
          fakeId,
          { title: 'No Existe' },
          agentUser._id.toString()
        );
  
        expect(updated).toBeNull();
      });
  
      it('debe actualizar múltiples campos', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa Múltiple',
            description: 'Original',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const updated = await updatePropertyByAgentService(
          property._id.toString(),
          {
            title: 'Casa Renovada',
            description: 'Nueva descripción',
            price: 150000,
            bedrooms: 3,
          },
          agentUser._id.toString()
        );
  
        expect(updated!.title).toBe('Casa Renovada');
        expect(updated!.description).toBe('Nueva descripción');
        expect(updated!.price).toBe(150000);
        expect(updated!.bedrooms).toBe(3);
      });
    });
  
    // ==================== UPDATE PROPERTY BY ADMIN ====================
    describe('updatePropertyByAdminService', () => {
      it('debe actualizar cualquier propiedad', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa Agente',
            description: 'Propiedad del agente',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const updated = await updatePropertyByAdminService(property._id.toString(), {
          title: 'Casa Actualizada por Admin',
          price: 200000,
        });
  
        expect(updated).toBeDefined();
        expect(updated!.title).toBe('Casa Actualizada por Admin');
        expect(updated!.price).toBe(200000);
      });
  
      it('debe permitir reasignar owner', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa Original',
            description: 'Del agente 1',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const updated = await updatePropertyByAdminService(property._id.toString(), {
          owner: anotherAgentUser._id.toString(),
        });
  
        expect(updated!.owner.toString()).toBe(anotherAgentUser._id.toString());
      });
  
      it('debe retornar null con ID inexistente', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
  
        const updated = await updatePropertyByAdminService(fakeId, {
          title: 'No Existe',
        });
  
        expect(updated).toBeNull();
      });
    });
  
    // ==================== DELETE PROPERTY BY AGENT ====================
    describe('deletePropertyByAgentService', () => {
      it('debe eliminar su propia propiedad', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa a Eliminar',
            description: 'Se eliminará',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const deleted = await deletePropertyByAgentService(
          property._id.toString(),
          agentUser._id.toString()
        );
  
        expect(deleted).toBeDefined();
        expect(deleted!._id.toString()).toBe(property._id.toString());
  
        // Verificar que ya no existe
        const found = await getPropertyByIdService(property._id.toString());
        expect(found).toBeNull();
      });
  
      it('debe eliminar tareas asociadas (cascade delete)', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa con Tareas',
            description: 'Tiene tareas',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        // Crear tareas asociadas
        await TaskModel.create({
          title: 'Tarea 1',
          description: 'Descripción 1',
          status: 'pendiente',
          property: property._id,
          assignedTo: agentUser._id,
        });
  
        await TaskModel.create({
          title: 'Tarea 2',
          description: 'Descripción 2',
          status: 'pendiente',
          property: property._id,
          assignedTo: agentUser._id,
        });
  
        // Verificar que existen tareas
        const tasksBefore = await TaskModel.find({ property: property._id });
        expect(tasksBefore).toHaveLength(2);
  
        // Eliminar propiedad
        await deletePropertyByAgentService(property._id.toString(), agentUser._id.toString());
  
        // Verificar que las tareas fueron eliminadas
        const tasksAfter = await TaskModel.find({ property: property._id });
        expect(tasksAfter).toHaveLength(0);
      });
  
      it('NO debe eliminar propiedad de otro agente', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa Protegida',
            description: 'Del agente 1',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        // Otro agente intenta eliminar
        const deleted = await deletePropertyByAgentService(
          property._id.toString(),
          anotherAgentUser._id.toString()
        );
  
        expect(deleted).toBeNull();
  
        // Verificar que la propiedad sigue existiendo
        const found = await getPropertyByIdService(property._id.toString());
        expect(found).toBeDefined();
      });
  
      it('debe retornar null con ID inexistente', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
  
        const deleted = await deletePropertyByAgentService(fakeId, agentUser._id.toString());
  
        expect(deleted).toBeNull();
      });
    });
  
    // ==================== DELETE PROPERTY BY ADMIN ====================
    describe('deletePropertyByAdminService', () => {
      it('debe eliminar cualquier propiedad', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa del Agente',
            description: 'Será eliminada por admin',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const deleted = await deletePropertyByAdminService(property._id.toString());
  
        expect(deleted).toBeDefined();
        expect(deleted!._id.toString()).toBe(property._id.toString());
      });
  
      it('debe eliminar tareas asociadas (cascade delete)', async () => {
        const property = await createPropertyByAgentService(
          {
            title: 'Casa Admin con Tareas',
            description: 'Tiene tareas',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        // Crear tarea asociada
        await TaskModel.create({
          title: 'Tarea Admin',
          description: 'Será eliminada',
          status: 'pendiente',
          property: property._id,
          assignedTo: agentUser._id,
        });
  
        // Eliminar propiedad como admin
        await deletePropertyByAdminService(property._id.toString());
  
        // Verificar que la tarea fue eliminada
        const tasks = await TaskModel.find({ property: property._id });
        expect(tasks).toHaveLength(0);
      });
  
      it('debe retornar null con ID inexistente', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
  
        const deleted = await deletePropertyByAdminService(fakeId);
  
        expect(deleted).toBeNull();
      });
    });
  
    // ==================== GET ALL PROPERTIES ====================
    describe('getAllPropertiesService', () => {
      it('debe obtener todas las propiedades con owner poblado', async () => {
        await createPropertyByAgentService(
          {
            title: 'Casa 1',
            description: 'Primera casa',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        await createPropertyByAgentService(
          {
            title: 'Casa 2',
            description: 'Segunda casa',
            price: 150000,
            location: 'Bogotá',
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            imageUrls: [],
          },
          anotherAgentUser._id.toString()
        );
  
        const properties = await getAllPropertiesService();
  

            // Línea 510-515: Verificar que owner está poblado y agregar cast
            expect(properties).toHaveLength(2);
            expect(properties[0]).toBeDefined();
            expect(properties[0]!.owner).toBeDefined();
            expect(properties[0]!.owner).toHaveProperty('email');
            // Verificar que password no está poblado
            expect((properties[0]!.owner as any).password).toBeUndefined();
      });
  
      it('debe retornar array vacío si no hay propiedades', async () => {
        const properties = await getAllPropertiesService();
  
        expect(properties).toEqual([]);
        expect(Array.isArray(properties)).toBe(true);
      });
  
      it('debe obtener propiedades de múltiples agentes', async () => {
        await createPropertyByAgentService(
          {
            title: 'Casa Agente 1',
            description: 'Del agente 1',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        await createPropertyByAgentService(
          {
            title: 'Casa Agente 1 - 2',
            description: 'Segunda del agente 1',
            price: 120000,
            location: 'Cali',
            bedrooms: 3,
            bathrooms: 2,
            area: 100,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        await createPropertyByAgentService(
          {
            title: 'Casa Agente 2',
            description: 'Del agente 2',
            price: 150000,
            location: 'Bogotá',
            bedrooms: 4,
            bathrooms: 3,
            area: 150,
            imageUrls: [],
          },
          anotherAgentUser._id.toString()
        );
  
        const properties = await getAllPropertiesService();
  
        expect(properties).toHaveLength(3);
  
        // Contar propiedades por agente
        const agent1Properties = properties.filter(
          (p) => p.owner._id.toString() === agentUser._id.toString()
        );
        const agent2Properties = properties.filter(
          (p) => p.owner._id.toString() === anotherAgentUser._id.toString()
        );
  
        expect(agent1Properties).toHaveLength(2);
        expect(agent2Properties).toHaveLength(1);
      });
    });
  
    // ==================== GET PROPERTY BY ID ====================
    describe('getPropertyByIdService', () => {
      it('debe obtener propiedad por ID con owner poblado', async () => {
        const created = await createPropertyByAgentService(
          {
            title: 'Casa Específica',
            description: 'Para buscar por ID',
            price: 180000,
            location: 'Medellín',
            bedrooms: 3,
            bathrooms: 2,
            area: 110,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const property = await getPropertyByIdService(created._id.toString());
  
        expect(property).toBeDefined();
        expect(property!._id.toString()).toBe(created._id.toString());
        expect(property!.title).toBe('Casa Específica');
        expect(property!.owner).toBeDefined();
        expect(property!.owner).toHaveProperty('email');
        expect((property!.owner as any).email).toBe(agentUser.email);
    });
  
      it('debe retornar null con ID inexistente', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
  
        const property = await getPropertyByIdService(fakeId);
  
        expect(property).toBeNull();
      });
  
      it('debe fallar con ID inválido', async () => {
        await expect(getPropertyByIdService('id-invalido')).rejects.toThrow();
      });
  
      it('owner no debe tener password', async () => {
        const created = await createPropertyByAgentService(
          {
            title: 'Casa Sin Password',
            description: 'Owner sin password',
            price: 100000,
            location: 'Cali',
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            imageUrls: [],
          },
          agentUser._id.toString()
        );
  
        const property = await getPropertyByIdService(created._id.toString());
  
        expect((property!.owner as any).password).toBeUndefined();
      });
    });
  });