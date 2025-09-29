import { type PropertyResponseDto } from '../dtos/property.dto';
import { type UserResponseDto } from '../dtos/user.dto';
import { serializeUser } from './user.serializer';
import { Types } from 'mongoose';

/**
 * Convierte un documento de propiedad de Mongoose a un DTO de respuesta seguro.
 * @param propertyDocument - El documento de Mongoose (puede tener owner poblado o no).
 * @returns Un objeto PropertyResponseDto seguro para el cliente.
 */
export const serializeProperty = (propertyDocument: any): PropertyResponseDto => {
  let ownerResponse: string | UserResponseDto;

  // Comprobamos si el campo 'owner' ha sido "poblado" (es un objeto) o es solo un ID.
  if (propertyDocument.owner instanceof Types.ObjectId || typeof propertyDocument.owner === 'string') {
    // Si es un ObjectId o string, lo convertimos a string
    ownerResponse = propertyDocument.owner.toString();
  } else if (propertyDocument.owner && typeof propertyDocument.owner === 'object') {
    // Si es un objeto poblado, usamos nuestro serializador de usuarios
    ownerResponse = serializeUser(propertyDocument.owner);
  } else {
    // Fallback en caso de que owner sea undefined o null
    ownerResponse = propertyDocument.owner?.toString() || '';
  }

  return {
    id: propertyDocument._id.toString(),
    title: propertyDocument.title,
    description: propertyDocument.description,
    price: propertyDocument.price,
    location: propertyDocument.location,
    bedrooms: propertyDocument.bedrooms,
    bathrooms: propertyDocument.bathrooms,
    area: propertyDocument.area,
    imageUrls: propertyDocument.imageUrls || [],
    owner: ownerResponse,
    createdAt: propertyDocument.createdAt!,
    updatedAt: propertyDocument.updatedAt!
  };
};