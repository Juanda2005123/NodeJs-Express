import { type PropertyResponseDto } from '../dtos/property.dto';
import { type UserResponseDto } from '../dtos/user.dto';
import { serializeUser } from './user.serializer';

/**
 * Convierte un documento de propiedad de Mongoose a un DTO de respuesta seguro.
 * @param propertyDocument - El documento de Mongoose (owner puede estar poblado o ser solo ID).
 * @returns Un objeto PropertyResponseDto seguro para el cliente.
 */
export const serializeProperty = (propertyDocument: any): PropertyResponseDto => {
  let ownerResponse: string | UserResponseDto;

  // Si owner está poblado (objeto con _id), lo serializamos como UserResponseDto
  if (propertyDocument.owner && typeof propertyDocument.owner === 'object' && propertyDocument.owner._id) {
    // Owner está poblado - usado en Property services
    ownerResponse = serializeUser(propertyDocument.owner);
  } else {
    // Owner es solo ObjectId - usado en Task services (mantener como ID string)
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
    owner: ownerResponse, // ID string en Task responses, UserResponseDto en Property responses
    createdAt: propertyDocument.createdAt!,
    updatedAt: propertyDocument.updatedAt!
  };
};