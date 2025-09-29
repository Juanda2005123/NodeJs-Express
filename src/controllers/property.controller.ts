import { type Request, type Response, type NextFunction } from 'express'; 
import { serializeProperty } from '../utils/property.serializer';
import { getAllPropertiesService, getPropertyByIdService, createPropertyByAgentService, updatePropertyByAgentService, deletePropertyByAgentService, createPropertyByAdminService, updatePropertyByAdminService, deletePropertyByAdminService } from '../services/property.service';
import { type PropertyListResponseDto, type CreatePropertyByAgentDto, type UpdatePropertyByAgentDto, type CreatePropertyByAdminDto, type UpdatePropertyByAdminDto } from '../dtos/property.dto';

// --- Controladores Públicos ---

/**
 * @description Controlador público para obtener todas las propiedades disponibles.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getAllPropertiesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await getAllPropertiesService();
    const propertiesResponse = properties.map(property => serializeProperty(property));
    
    const response: PropertyListResponseDto = {
      properties: propertiesResponse,
      total: propertiesResponse.length
    };
    
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador público para obtener una propiedad específica por su ID.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getPropertyByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: propertyId } = req.params;
    
    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }
    
    const property = await getPropertyByIdService(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }
    
    const propertyResponse = serializeProperty(property);
    
    return res.status(200).json(propertyResponse);
  } catch (error) {
    next(error);
  }
};

// --- Controladores Privados para Agentes ---

/**
 * @description Controlador para que un agente cree una nueva propiedad.
 * El owner se asigna automáticamente al agente autenticado.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const createPropertyByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.user!.id;
    
    const propertyData: CreatePropertyByAgentDto = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      area: req.body.area,
      imageUrls: req.body.imageUrls
    };

    const newProperty = await createPropertyByAgentService(propertyData, agentId);
    const propertyResponse = serializeProperty(newProperty);
    return res.status(201).json({ 
      message: 'Propiedad creada exitosamente', 
      property: propertyResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente actualice una de sus propiedades.
 * Solo puede actualizar propiedades de las que es owner.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const updatePropertyByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: propertyId } = req.params;
    const agentId = req.user!.id;

    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }

    const updateData: UpdatePropertyByAgentDto = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      area: req.body.area,
      imageUrls: req.body.imageUrls
    };

    // Limpiar campos undefined
    Object.keys(updateData).forEach(
      key => (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    const updatedProperty = await updatePropertyByAgentService(propertyId, updateData, agentId);

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }

    const propertyResponse = serializeProperty(updatedProperty);
    return res.status(200).json({ 
      message: 'Propiedad actualizada exitosamente', 
      property: propertyResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un agente elimine una de sus propiedades.
 * Solo puede eliminar propiedades de las que es owner.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const deletePropertyByAgentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: propertyId } = req.params;
    const agentId = req.user!.id;

    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }

    // Servicio encapsula toda la lógica: verificación de existencia y ownership
    const deletedProperty = await deletePropertyByAgentService(propertyId, agentId);

    if (!deletedProperty) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --- Controladores de Administración (Superadmin) ---

/**
 * @description Controlador para que un superadmin cree una nueva propiedad.
 * Puede asignar cualquier usuario como owner de la propiedad.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const createPropertyByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const propertyData: CreatePropertyByAdminDto = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      area: req.body.area,
      imageUrls: req.body.imageUrls,
      owner: req.body.owner
    };

    const newProperty = await createPropertyByAdminService(propertyData);
    const propertyResponse = serializeProperty(newProperty);
    return res.status(201).json({ 
      message: 'Propiedad creada exitosamente por el administrador', 
      property: propertyResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin actualice cualquier propiedad.
 * Puede actualizar cualquier propiedad sin restricciones de ownership.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const updatePropertyByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }

    const updateData: UpdatePropertyByAdminDto = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      area: req.body.area,
      imageUrls: req.body.imageUrls,
      owner: req.body.owner
    };

    // Limpiar campos undefined
    Object.keys(updateData).forEach(
      key => (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    const updatedProperty = await updatePropertyByAdminService(propertyId, updateData);

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }

    const propertyResponse = serializeProperty(updatedProperty);
    return res.status(200).json({ 
      message: 'Propiedad actualizada exitosamente por el administrador', 
      property: propertyResponse 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin elimine cualquier propiedad.
 * Puede eliminar cualquier propiedad sin restricciones de ownership.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const deletePropertyByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ message: 'El ID de la propiedad es requerido.' });
    }

    // Servicio específico para superadmin sin restricciones de ownership
    const deletedProperty = await deletePropertyByAdminService(propertyId);

    if (!deletedProperty) {
      return res.status(404).json({ message: 'Propiedad no encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};