import {type CreatePropertyByAdminDto, type CreatePropertyByAgentDto, type UpdatePropertyByAdminDto, type UpdatePropertyByAgentDto} from '../dtos/property.dto';
import PropertyModel from '../models/Property.model';
import TaskModel from '../models/Task.model';

/**
 * @description Servicio para que un agente cree una nueva propiedad.
 * @param propertyData - El DTO con los datos de la propiedad a crear.
 * @param agentId - El ID del agente (obtenido del token JWT) que será el propietario.
 * @returns El DTO de respuesta de la propiedad recién creada.
 * @throws Lanza un error si la operación de guardado falla.
 */
export const createPropertyByAgentService = async (propertyData: CreatePropertyByAgentDto, agentId: string) => {
    try {
        const newPropertyData = {
            ...propertyData,
            owner: agentId
        };

        const newProperty = new PropertyModel(newPropertyData);
        await newProperty.save();

        return newProperty;
    } catch (error) {
        throw error;
    }

};

/**
 * @description Servicio para que un superadmin cree una nueva propiedad.
 * @param propertyData - El DTO con los datos de la propiedad a crear (incluye owner).
 * @returns El documento de la propiedad recién creada.
 * @throws Lanza un error si la operación de guardado falla.
 */
export const createPropertyByAdminService = async (propertyData: CreatePropertyByAdminDto) => {
    try {
        const newProperty = new PropertyModel(propertyData);
        await newProperty.save();

        return newProperty;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente actualice UNA DE SUS PROPIEDADES.
 * Optimizado: usa filtro combinado para actualizar solo si es propietario.
 * @param propertyId - El ID de la propiedad a actualizar.
 * @param agentId - El ID del agente que realiza la petición.
 * @param propertyData - El DTO con los datos a actualizar.
 * @returns El DTO de la propiedad actualizada o null si no se encuentra o no es propietario.
 * @throws Lanza un error si la operación de actualización falla.
 */
export const updatePropertyByAgentService = async (propertyId: string, propertyData: UpdatePropertyByAgentDto, agentId: string) => {
    try {
        // Filtro combinado: actualiza solo si la propiedad existe Y pertenece al agente
        const updatedProperty = await PropertyModel.findOneAndUpdate(
            { 
                _id: propertyId, 
                owner: agentId 
            }, 
            propertyData, 
            { new: true }
        );

        if (!updatedProperty) {
            return null; // Propiedad no encontrada o no es propietario
        }
        
        return updatedProperty;

    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin actualice cualquier propiedad.
 * @param propertyId - El ID de la propiedad a actualizar.
 * @param propertyData - El DTO con los datos a actualizar (puede incluir owner).
 * @returns El documento de la propiedad actualizada o null si no se encuentra.
 * @throws Lanza un error si la operación de actualización falla.
 */
export const updatePropertyByAdminService = async (propertyId: string, propertyData: UpdatePropertyByAdminDto) => {
    try {
        const updatedProperty = await PropertyModel.findByIdAndUpdate(propertyId, propertyData, { new: true });
        
        if (!updatedProperty) {
            return null; // Propiedad no encontrada
        }

        return updatedProperty;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un agente elimine UNA DE SUS PROPIEDADES.
 * Optimizado: usa filtro combinado + cascade delete de tareas asociadas.
 * @param propertyId - El ID de la propiedad a eliminar.
 * @param agentId - El ID del agente que solicita la eliminación.
 * @returns El documento de la propiedad eliminada o null si no se encuentra o no es propietario.
 * @throws Lanza un error si la operación de eliminación falla.
 */
export const deletePropertyByAgentService = async (propertyId: string, agentId: string) => {
    try {
        // Filtro combinado: elimina solo si la propiedad existe Y pertenece al agente
        const deletedProperty = await PropertyModel.findOneAndDelete({
            _id: propertyId,
            owner: agentId
        });

        if (!deletedProperty) {
            return null; // Propiedad no encontrada o no es propietario
        }

        // CASCADE DELETE: Eliminar todas las tareas asociadas a esta propiedad
        await TaskModel.deleteMany({ property: propertyId });
        
        return deletedProperty;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un superadmin elimine cualquier propiedad.
 * Sin restricciones de ownership + cascade delete de tareas asociadas.
 * @param propertyId - El ID de la propiedad a eliminar.
 * @returns El documento de la propiedad eliminada o null si no se encuentra.
 * @throws Lanza un error si la operación de eliminación falla.
 */
export const deletePropertyByAdminService = async (propertyId: string) => {
    try {
        const deletedProperty = await PropertyModel.findByIdAndDelete(propertyId);

        if (!deletedProperty) {
            return null; // Propiedad no encontrada para eliminar
        }

        // CASCADE DELETE: Eliminar todas las tareas asociadas a esta propiedad
        await TaskModel.deleteMany({ property: propertyId });
        
        return deletedProperty;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para obtener todas las propiedades con información del propietario.
 * @returns Array de propiedades con owner poblado (vacío si no hay propiedades).
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getAllPropertiesService = async () => {
    try {
        const properties = await PropertyModel.find().populate('owner', '-password');
        return properties;
    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para obtener una propiedad por su ID con información del propietario.
 * @param propertyId - El ID de la propiedad a buscar.
 * @returns El documento de la propiedad con owner poblado o null si no se encuentra.
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getPropertyByIdService = async (propertyId: string) => {
    try {
        const property = await PropertyModel.findById(propertyId).populate('owner', '-password');

        if (!property) {
            return null; // Propiedad no encontrada
        }

        return property;
    } catch (error) {
        throw error;
    }
};