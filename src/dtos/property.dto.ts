import { Types } from 'mongoose';
import { type UserResponseDto } from './user.dto';

// --- DTOs para Entrada (Solicitud) ---

/**
 * @description DTO para que un agente cree una nueva propiedad.
 * El 'owner' se asignará automáticamente desde el token del agente.
 */
export interface CreatePropertyByAgentDto {
  title:        string;
  description:  string;
  price:        number;
  location:     string;
  bedrooms:     number;
  bathrooms:    number;
  area:         number;
  imageUrls?:   string[];
}

/**
 * @description DTO para que un superadmin cree una nueva propiedad.
 * Permite especificar el 'owner' (ID del agente).
 */
export interface CreatePropertyByAdminDto {
  title:        string;
  description:  string;
  price:        number;
  location:     string;
  bedrooms:     number;
  bathrooms:    number;
  area:         number;
  imageUrls?:   string[];
  owner:        Types.ObjectId | string; // Aceptamos ObjectId o string para flexibilidad
}

/**
 * @description DTO para que un agente actualice una de sus propiedades.
 * Todos los campos son opcionales y no se puede cambiar el 'owner'.
 */
export interface UpdatePropertyByAgentDto {
  title?:       string;
  description?: string;
  price?:       number;
  location?:    string;
  bedrooms?:    number;
  bathrooms?:   number;
  area?:        number;
  imageUrls?:   string[];
}

/**
 * @description DTO para que un superadmin actualice cualquier propiedad.
 * Todos los campos son opcionales y SÍ se puede cambiar el 'owner'.
 */
export interface UpdatePropertyByAdminDto {
  title?:       string;
  description?: string;
  price?:       number;
  location?:    string;
  bedrooms?:    number;
  bathrooms?:   number;
  area?:        number;
  imageUrls?:   string[];
  owner?:       Types.ObjectId | string;
}

// --- DTOs para Salida (Respuesta) ---

/**
 * @description Define la forma segura de un objeto de Propiedad que se envía al cliente.
 * El 'owner' puede ser un ID string (en Task responses) o el objeto UserResponseDto completo (en Property responses).
 */
export interface PropertyResponseDto {
  id:          string;
  title:       string;
  description: string;
  price:       number;
  location:    string;
  bedrooms:    number;
  bathrooms:   number;
  area:        number;
  imageUrls:   string[];
  owner:       string | UserResponseDto; // <-- ID string en Task responses, UserResponseDto en Property responses
  createdAt:   Date;
  updatedAt:   Date;
}

/**
 * @description Define la forma de la respuesta al listar propiedades.
 * Incluye la lista de propiedades y el total para la paginación.
 */
export interface PropertyListResponseDto {
  properties: PropertyResponseDto[];
  total:      number;
}