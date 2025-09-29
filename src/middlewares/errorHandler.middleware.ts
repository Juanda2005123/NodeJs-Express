import { type Request, type Response, type NextFunction } from 'express';

export const errorHandlerMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Logueamos el error completo en la consola del servidor para tener un registro interno.
  console.error('Error capturado:', error);

  // --- Manejo de Errores Específicos de la Base de Datos ---

  // Error de clave duplicada de MongoDB (código 11000)
  if (error.code === 11000 && error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
    if (field) {
      const value = error.keyValue[field];
      return res.status(409).json({
        message: `Error de conflicto: El campo '${field}' con el valor '${value}' ya existe.`
      });
    }
  }

  // Error de validación de campos de Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return res.status(400).json({
      message: 'Error de validación de datos',
      errors: errors
    });
  }

  // ¡NUEVO! Error de CastError de Mongoose (ej. ID de MongoDB malformado)
  if (error.name === 'CastError' && error.path) {
    return res.status(400).json({
      message: `Error de formato: El valor '${error.value}' no es válido para el campo '${error.path}'.`
    });
  }


  // --- Manejo de Errores Genéricos (Producción vs. Desarrollo) ---

  // Determinamos el código de estado. Si el error ya tiene uno, lo usamos. Si no, es un 500.
  const statusCode = error.statusCode || 500;
  
  // Determinamos el mensaje.
  const message = statusCode === 500 ? 'Ocurrió un error interno inesperado en el servidor.' : error.message;

  const errorResponse: { message: string, stack?: string } = {
    message: message
  };

  // ¡MEJORA CLAVE! Solo enviamos el 'stack trace' si estamos en un entorno de desarrollo.
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = error.stack;
  }

  return res.status(statusCode).json(errorResponse);
};