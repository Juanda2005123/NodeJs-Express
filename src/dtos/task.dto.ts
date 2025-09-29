import { Types } from 'mongoose';
import { type UserResponseDto } from './user.dto';
import { type PropertyResponseDto } from './property.dto';

// --- DTOs para Entrada (Solicitud) ---

/**
 * @description DTO para crear una nueva tarea.
 * Usado tanto por agentes como por superadmins.
 * 
 * REGLAS DE NEGOCIO:
 * - Un agente solo puede especificar propiedades de las que es owner
 * - Un superadmin puede especificar cualquier propiedad  
 * - El 'assignedTo' se establece automáticamente al owner de la propiedad (REGLA INMUTABLE)
 */
export interface CreateTaskDto {
  title:       string;
  description: string;
  property:    Types.ObjectId | string; // ID de la propiedad
  // ❌ NO incluye 'assignedTo' - Se asigna automáticamente al owner de la property
}

/**
 * @description DTO para que un agente actualice una de sus tareas asignadas.
 * Todos los campos son opcionales. 
 * NO puede cambiar 'property' ni 'assignedTo' (reglas de negocio).
 */
export interface UpdateTaskByAgentDto {
  title?:       string;
  description?: string;
  isCompleted?: boolean;
  // ❌ NO incluye 'property' - No puede reasignar a otra propiedad
  // ❌ NO incluye 'assignedTo' - No puede reasignarse a sí mismo u otro agente
}

/**
 * @description DTO para que un superadmin actualice cualquier tarea.
 * Todos los campos son opcionales.
 * Puede cambiar 'property' (pero 'assignedTo' se recalcula automáticamente).
 */
export interface UpdateTaskByAdminDto {
  title?:       string;
  description?: string;
  isCompleted?: boolean;
  property?:    Types.ObjectId | string; // ✅ Puede cambiar la propiedad asociada
  // ❌ NO incluye 'assignedTo' - REGLA INMUTABLE: siempre se recalcula según el owner de la property
}

// --- DTOs para Salida (Respuesta) ---

/**
 * @description Define la forma segura de un objeto de Tarea que se envía al cliente.
 * Los campos 'property' y 'assignedTo' siempre son objetos poblados.
 */
export interface TaskResponseDto {
  id:          string;
  title:       string;
  description: string;
  isCompleted: boolean;
  property:    PropertyResponseDto; // Siempre es el objeto completo de la propiedad
  assignedTo:  UserResponseDto;     // Siempre es el objeto completo del usuario asignado
  createdAt:   Date;
  updatedAt:   Date;
}

/**
 * @description Define la forma de la respuesta al listar tareas.
 * Incluye la lista de tareas y el total para la paginación.
 */
export interface TaskListResponseDto {
  tasks: TaskResponseDto[];
  total: number;
}