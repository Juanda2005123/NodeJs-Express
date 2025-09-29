import { type UserResponseDto } from '../dtos/user.dto';

/**
 * Convierte un documento de usuario de Mongoose a un DTO de respuesta seguro.
 * @param userDocument - El documento de Mongoose que incluye todos los campos.
 * @returns Un objeto UserResponseDto sin campos sensibles.
 */
export const serializeUser = (userDocument: any): UserResponseDto => {
  return {
    id: userDocument._id.toString(), // Convertimos el ObjectId a string
    name: userDocument.name,
    email: userDocument.email,
    role: userDocument.role,
    createdAt: userDocument.createdAt!, // Usamos '!' porque sabemos que timestamps:true los añade
    updatedAt: userDocument.updatedAt!
  };
};