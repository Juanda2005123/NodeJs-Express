import { type TaskResponseDto } from '../dtos/task.dto';
import { type UserResponseDto } from '../dtos/user.dto';
import { type PropertyResponseDto } from '../dtos/property.dto';
import { serializeUser } from './user.serializer';
import { serializeProperty } from './property.serializer';

/**
 * Convierte un documento de tarea de Mongoose a un DTO de respuesta seguro.
 * @param taskDocument - El documento de Mongoose con property y assignedTo siempre poblados.
 * @returns Un objeto TaskResponseDto seguro para el cliente.
 */
export const serializeTask = (taskDocument: any): TaskResponseDto => {
  return {
    id: taskDocument._id.toString(),
    title: taskDocument.title,
    description: taskDocument.description,
    isCompleted: taskDocument.isCompleted,
    property: serializeProperty(taskDocument.property),     // Siempre es un objeto poblado
    assignedTo: serializeUser(taskDocument.assignedTo),     // Siempre es un objeto poblado
    createdAt: taskDocument.createdAt!,
    updatedAt: taskDocument.updatedAt!
  };
};