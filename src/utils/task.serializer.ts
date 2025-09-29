import { type TaskResponseDto } from '../dtos/task.dto';
import { type UserResponseDto } from '../dtos/user.dto';
import { type PropertyResponseDto } from '../dtos/property.dto';
import { serializeUser } from './user.serializer';
import { serializeProperty } from './property.serializer';
import { Types } from 'mongoose';

/**
 * Convierte un documento de tarea de Mongoose a un DTO de respuesta seguro.
 * @param taskDocument - El documento de Mongoose (puede tener property y assignedTo poblados o no).
 * @returns Un objeto TaskResponseDto seguro para el cliente.
 */
export const serializeTask = (taskDocument: any): TaskResponseDto => {
  let propertyResponse: string | PropertyResponseDto;
  let assignedToResponse: string | UserResponseDto;

  // Manejo del campo 'property' (poblado o no)
  if (taskDocument.property instanceof Types.ObjectId || typeof taskDocument.property === 'string') {
    // Si es un ObjectId o string, lo convertimos a string
    propertyResponse = taskDocument.property.toString();
  } else if (taskDocument.property && typeof taskDocument.property === 'object') {
    // Si es un objeto poblado, usamos nuestro serializador de propiedades
    propertyResponse = serializeProperty(taskDocument.property);
  } else {
    // Fallback en caso de que property sea undefined o null
    propertyResponse = taskDocument.property?.toString() || '';
  }

  // Manejo del campo 'assignedTo' (poblado o no)
  if (taskDocument.assignedTo instanceof Types.ObjectId || typeof taskDocument.assignedTo === 'string') {
    // Si es un ObjectId o string, lo convertimos a string
    assignedToResponse = taskDocument.assignedTo.toString();
  } else if (taskDocument.assignedTo && typeof taskDocument.assignedTo === 'object') {
    // Si es un objeto poblado, usamos nuestro serializador de usuarios
    assignedToResponse = serializeUser(taskDocument.assignedTo);
  } else {
    // Fallback en caso de que assignedTo sea undefined o null
    assignedToResponse = taskDocument.assignedTo?.toString() || '';
  }

  return {
    id: taskDocument._id.toString(),
    title: taskDocument.title,
    description: taskDocument.description,
    isCompleted: taskDocument.isCompleted,
    property: propertyResponse,
    assignedTo: assignedToResponse,
    createdAt: taskDocument.createdAt!,
    updatedAt: taskDocument.updatedAt!
  };
};