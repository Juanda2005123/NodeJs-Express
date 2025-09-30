// tests/unit/services/task.service.test.ts
import {
  createTaskByAgentService,
  createTaskByAdminService,
  updateTaskByAgentService,
  updateTaskByAdminService,
  deleteTaskByAgentService,
  deleteTaskByAdminService,
  getAllTaskService,
  getAllTasksByAgentService,
  getTaskByIdForAgentService,
  getTaskByIdForAdminService,
  getTasksByPropertyForAgentService,
  getTasksByPropertyForAdminService,
} from '../../../src/services/task.service';
import TaskModel from '../../../src/models/Task.model';
import PropertyModel from '../../../src/models/Property.model';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/db.helper';
import { userFactory } from '../../helpers/factories';
import { registerUserService } from '../../../src/services/user.service';
import { createPropertyByAgentService } from '../../../src/services/property.service';

describe('Task Service', () => {
  let agentUser: any;
  let anotherAgentUser: any;
  let agentProperty: any;
  let anotherAgentProperty: any;

  // Setup antes de todas las pruebas
  beforeAll(async () => {
    await connectTestDB();
  });

  // Crear usuarios y propiedades antes de cada prueba
  beforeEach(async () => {
    agentUser = await registerUserService(userFactory.agent({ email: 'agent@test.com' }));
    anotherAgentUser = await registerUserService(userFactory.agent({ email: 'agent2@test.com' }));

    // Crear propiedades para los agentes
    agentProperty = await createPropertyByAgentService(
      {
        title: 'Casa del Agente 1',
        description: 'Propiedad de prueba',
        price: 100000,
        location: 'Cali',
        bedrooms: 2,
        bathrooms: 1,
        area: 80,
        imageUrls: [],
      },
      agentUser._id.toString()
    );

    anotherAgentProperty = await createPropertyByAgentService(
      {
        title: 'Casa del Agente 2',
        description: 'Otra propiedad',
        price: 150000,
        location: 'Bogotá',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        imageUrls: [],
      },
      anotherAgentUser._id.toString()
    );
  });

  // Limpiar después de cada prueba
  afterEach(async () => {
    await clearTestDB();
  });

  // Desconexión final
  afterAll(async () => {
    await disconnectTestDB();
  });

  // ==================== CREATE TASK BY AGENT ====================
  describe('createTaskByAgentService', () => {
    it('debe crear tarea en su propia propiedad', async () => {
      const taskData = {
        title: 'Reparar techo',
        description: 'El techo tiene goteras',
        property: agentProperty._id.toString(),
      };

      const task = await createTaskByAgentService(taskData, agentUser._id.toString());

      expect(task).toBeDefined();
      expect(task).not.toBeNull();
      expect(task!.title).toBe('Reparar techo');
      expect(task!.isCompleted).toBe(false);
      expect(task!.property.toString()).toBe(agentProperty._id.toString());
      expect(task!.assignedTo.toString()).toBe(agentUser._id.toString());
    });

    it('debe asignar automáticamente la tarea al agente propietario', async () => {
      const taskData = {
        title: 'Pintar paredes',
        description: 'Pintar las paredes de blanco',
        property: agentProperty._id.toString(),
      };

      const task = await createTaskByAgentService(taskData, agentUser._id.toString());

      expect(task!.assignedTo.toString()).toBe(agentUser._id.toString());
    });

    it('NO debe crear tarea en propiedad de otro agente', async () => {
      const taskData = {
        title: 'Tarea No Autorizada',
        description: 'Intentando crear en propiedad ajena',
        property: anotherAgentProperty._id.toString(),
      };

      const task = await createTaskByAgentService(taskData, agentUser._id.toString());

      expect(task).toBeNull();
    });

    it('debe retornar null si la propiedad no existe', async () => {
      const fakePropertyId = '507f1f77bcf86cd799439011';
      const taskData = {
        title: 'Tarea en Propiedad Inexistente',
        description: 'Esta propiedad no existe',
        property: fakePropertyId,
      };

      const task = await createTaskByAgentService(taskData, agentUser._id.toString());

      expect(task).toBeNull();
    });

    it('debe crear tarea con status específico', async () => {
      const taskData = {
        title: 'Tarea en Progreso',
        description: 'Ya empezada',
        property: agentProperty._id.toString(),
      };

      const task = await createTaskByAgentService(taskData, agentUser._id.toString());

      expect(task!.isCompleted).toBe(false);
    });
  });

  // ==================== CREATE TASK BY ADMIN ====================
  describe('createTaskByAdminService', () => {
    it('debe crear tarea en cualquier propiedad', async () => {
      const taskData = {
        title: 'Tarea Admin',
        description: 'Creada por admin',
        property: agentProperty._id.toString(),
      };

      const task = await createTaskByAdminService(taskData);

      expect(task).toBeDefined();
      expect(task).not.toBeNull();
      expect(task!.title).toBe('Tarea Admin');
      expect(task!.assignedTo.toString()).toBe(agentUser._id.toString());
    });

    it('debe asignar automáticamente al owner de la propiedad', async () => {
      const taskData = {
        title: 'Tarea para Agente 2',
        description: 'Debe asignarse al agente 2',
        property: anotherAgentProperty._id.toString(),
      };

      const task = await createTaskByAdminService(taskData);

      expect(task!.assignedTo.toString()).toBe(anotherAgentUser._id.toString());
    });

    it('debe retornar null si la propiedad no existe', async () => {
      const fakePropertyId = '507f1f77bcf86cd799439011';
      const taskData = {
        title: 'Tarea Inválida',
        description: 'Propiedad no existe',
        property: fakePropertyId,
      };

      const task = await createTaskByAdminService(taskData);

      expect(task).toBeNull();
    });
  });

  // ==================== UPDATE TASK BY AGENT ====================
  describe('updateTaskByAgentService', () => {
    it('debe actualizar su propia tarea', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea Original',
          description: 'Descripción original',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const updated = await updateTaskByAgentService(
        task!._id.toString(),
        { title: 'Tarea Actualizada', isCompleted: false },
        agentUser._id.toString()
      );

      expect(updated).toBeDefined();
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('Tarea Actualizada');
      expect(updated!.isCompleted).toBe(false);
    });

    it('debe actualizar solo el status', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea de Status',
          description: 'Cambiar status',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const updated = await updateTaskByAgentService(
        task!._id.toString(),
        { isCompleted: true },
        agentUser._id.toString()
      );

      expect(updated!.isCompleted).toBe(true);
      expect(updated!.title).toBe('Tarea de Status');
    });

    it('NO debe actualizar tarea de otro agente', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea Protegida',
          description: 'Del agente 1',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const updated = await updateTaskByAgentService(
        task!._id.toString(),
        { title: 'Intento de Actualización' },
        anotherAgentUser._id.toString()
      );

      expect(updated).toBeNull();
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const updated = await updateTaskByAgentService(
        fakeId,
        { title: 'No Existe' },
        agentUser._id.toString()
      );

      expect(updated).toBeNull();
    });
  });

  // ==================== UPDATE TASK BY ADMIN ====================
  describe('updateTaskByAdminService', () => {
    it('debe actualizar cualquier tarea', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea del Agente',
          description: 'Para actualizar por admin',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const updated = await updateTaskByAdminService(task!._id.toString(), {
        title: 'Actualizada por Admin',
        isCompleted: true,
      });

      expect(updated).toBeDefined();
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('Actualizada por Admin');
      expect(updated!.isCompleted).toBe(true);
    });

    it('debe reasignar tarea al cambiar de propiedad', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea a Reasignar',
          description: 'Cambiar de propiedad',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      expect(task!.assignedTo.toString()).toBe(agentUser._id.toString());

      const updated = await updateTaskByAdminService(task!._id.toString(), {
        property: anotherAgentProperty._id.toString(),
      });

      expect(updated!.assignedTo.toString()).toBe(anotherAgentUser._id.toString());
      expect(updated!.property.toString()).toBe(anotherAgentProperty._id.toString());
    });

    it('debe retornar null si nueva propiedad no existe', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea Original',
          description: 'Tarea válida',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const fakePropertyId = '507f1f77bcf86cd799439011';
      const updated = await updateTaskByAdminService(task!._id.toString(), {
        property: fakePropertyId,
      });

      expect(updated).toBeNull();
    });

    it('debe retornar null con ID de tarea inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const updated = await updateTaskByAdminService(fakeId, {
        title: 'No Existe',
      });

      expect(updated).toBeNull();
    });
  });

  // ==================== DELETE TASK BY AGENT ====================
  describe('deleteTaskByAgentService', () => {
    it('debe eliminar su propia tarea', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea a Eliminar',
          description: 'Se eliminará',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const deleted = await deleteTaskByAgentService(
        task!._id.toString(),
        agentUser._id.toString()
      );

      expect(deleted).toBeDefined();
      expect(deleted).not.toBeNull();
      expect(deleted!._id.toString()).toBe(task!._id.toString());

      const found = await TaskModel.findById(task!._id);
      expect(found).toBeNull();
    });

    it('NO debe eliminar tarea de otro agente', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea Protegida',
          description: 'Del agente 1',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const deleted = await deleteTaskByAgentService(
        task!._id.toString(),
        anotherAgentUser._id.toString()
      );

      expect(deleted).toBeNull();

      const found = await TaskModel.findById(task!._id);
      expect(found).toBeDefined();
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const deleted = await deleteTaskByAgentService(fakeId, agentUser._id.toString());

      expect(deleted).toBeNull();
    });
  });

  // ==================== DELETE TASK BY ADMIN ====================
  describe('deleteTaskByAdminService', () => {
    it('debe eliminar cualquier tarea', async () => {
      const task = await createTaskByAgentService(
        {
          title: 'Tarea del Agente',
          description: 'Será eliminada por admin',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const deleted = await deleteTaskByAdminService(task!._id.toString());

      expect(deleted).toBeDefined();
      expect(deleted).not.toBeNull();
      expect(deleted!._id.toString()).toBe(task!._id.toString());
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const deleted = await deleteTaskByAdminService(fakeId);

      expect(deleted).toBeNull();
    });
  });

  // ==================== GET ALL TASKS ====================
  describe('getAllTaskService', () => {
    it('debe obtener todas las tareas con datos poblados', async () => {
      await createTaskByAgentService(
        {
          title: 'Tarea 1',
          description: 'Primera tarea',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      await createTaskByAgentService(
        {
          title: 'Tarea 2',
          description: 'Segunda tarea',
          property: anotherAgentProperty._id.toString(),
        },
        anotherAgentUser._id.toString()
      );

      const tasks = await getAllTaskService();

      expect(tasks!).toHaveLength(2);
      expect(tasks[0]).toBeDefined();
      expect(tasks[0]!.property).toBeDefined();
      expect(tasks[0]!.assignedTo).toBeDefined();
    });

    it('debe retornar array vacío si no hay tareas', async () => {
      const tasks = await getAllTaskService();

      expect(tasks!).toEqual([]);
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  // ==================== GET ALL TASKS BY AGENT ====================
  describe('getAllTasksByAgentService', () => {
    it('debe obtener solo tareas asignadas al agente', async () => {
      await createTaskByAgentService(
        {
          title: 'Tarea Agente 1',
          description: 'Del agente 1',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      await createTaskByAgentService(
        {
          title: 'Tarea Agente 2',
          description: 'Del agente 2',
          property: anotherAgentProperty._id.toString(),
        },
        anotherAgentUser._id.toString()
      );

      const tasks = await getAllTasksByAgentService(agentUser._id.toString());

      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.title).toBe('Tarea Agente 1');
    });

    it('debe retornar array vacío si el agente no tiene tareas', async () => {
      const tasks = await getAllTasksByAgentService(agentUser._id.toString());

      expect(tasks!).toEqual([]);
    });
  });

  // ==================== GET TASK BY ID FOR AGENT ====================
  describe('getTaskByIdForAgentService', () => {
    it('debe obtener su propia tarea por ID', async () => {
      const created = await createTaskByAgentService(
        {
          title: 'Tarea Específica',
          description: 'Para buscar por ID',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const task = await getTaskByIdForAgentService(
        created!._id.toString(),
        agentUser._id.toString()
      );

      expect(task).toBeDefined();
      expect(task).not.toBeNull();
      expect(task!._id.toString()).toBe(created!._id.toString());
      expect(task!.title).toBe('Tarea Específica');
    });

    it('NO debe obtener tarea de otro agente', async () => {
      const created = await createTaskByAgentService(
        {
          title: 'Tarea Agente 1',
          description: 'Privada',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const task = await getTaskByIdForAgentService(
        created!._id.toString(),
        anotherAgentUser._id.toString()
      );

      expect(task).toBeNull();
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const task = await getTaskByIdForAgentService(fakeId, agentUser._id.toString());

      expect(task).toBeNull();
    });
  });

  // ==================== GET TASK BY ID FOR ADMIN ====================
  describe('getTaskByIdForAdminService', () => {
    it('debe obtener cualquier tarea por ID', async () => {
      const created = await createTaskByAgentService(
        {
          title: 'Tarea del Agente',
          description: 'Visible para admin',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const task = await getTaskByIdForAdminService(created!._id.toString());

      expect(task).toBeDefined();
      expect(task).not.toBeNull();
      expect(task!.title).toBe('Tarea del Agente');
    });

    it('debe retornar null con ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const task = await getTaskByIdForAdminService(fakeId);

      expect(task).toBeNull();
    });
  });

  // ==================== GET TASKS BY PROPERTY FOR AGENT ====================
  describe('getTasksByPropertyForAgentService', () => {
    it('debe obtener tareas de su propia propiedad', async () => {
      await createTaskByAgentService(
        {
          title: 'Tarea 1 de Propiedad',
          description: 'Primera tarea',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      await createTaskByAgentService(
        {
          title: 'Tarea 2 de Propiedad',
          description: 'Segunda tarea',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const tasks = await getTasksByPropertyForAgentService(
        agentProperty._id.toString(),
        agentUser._id.toString()
      );

      expect(tasks).not.toBeNull();
      expect(tasks!).toHaveLength(2);
    });

    it('NO debe obtener tareas de propiedad de otro agente', async () => {
      await createTaskByAgentService(
        {
          title: 'Tarea Privada',
          description: 'Del agente 1',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const tasks = await getTasksByPropertyForAgentService(
        agentProperty._id.toString(),
        anotherAgentUser._id.toString()
      );

      expect(tasks).toBeNull();
    });

    it('debe retornar null con propiedad inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const tasks = await getTasksByPropertyForAgentService(fakeId, agentUser._id.toString());

      expect(tasks).toBeNull();
    });

    it('debe retornar array vacío si la propiedad no tiene tareas', async () => {
      const tasks = await getTasksByPropertyForAgentService(
        agentProperty._id.toString(),
        agentUser._id.toString()
      );

      expect(tasks).not.toBeNull();
      expect(tasks!).toEqual([]);
    });
  });

  // ==================== GET TASKS BY PROPERTY FOR ADMIN ====================
  describe('getTasksByPropertyForAdminService', () => {
    it('debe obtener tareas de cualquier propiedad', async () => {
      await createTaskByAgentService(
        {
          title: 'Tarea Admin 1',
          description: 'Primera tarea',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      await createTaskByAgentService(
        {
          title: 'Tarea Admin 2',
          description: 'Segunda tarea',
          property: agentProperty._id.toString(),
        },
        agentUser._id.toString()
      );

      const tasks = await getTasksByPropertyForAdminService(agentProperty._id.toString());

      expect(tasks).not.toBeNull();
      expect(tasks!).toHaveLength(2);
    });

    it('debe retornar null con propiedad inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const tasks = await getTasksByPropertyForAdminService(fakeId);

      expect(tasks).toBeNull();
    });

    it('debe retornar array vacío si la propiedad no tiene tareas', async () => {
      const tasks = await getTasksByPropertyForAdminService(agentProperty._id.toString());

      expect(tasks).not.toBeNull();
      expect(tasks!).toEqual([]);
    });
  });
});