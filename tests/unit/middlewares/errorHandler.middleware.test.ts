// tests/unit/middlewares/errorHandler.middleware.test.ts

import { Request, Response, NextFunction } from 'express';
import { errorHandlerMiddleware } from '../../../src/middlewares/errorHandler.middleware';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  // Guardar el NODE_ENV original
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Spy en console.error para verificar el logging
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Setup response mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {};
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  // ==================== ERRORES DE BASE DE DATOS ====================
  describe('Errores de Base de Datos', () => {
    it('debe manejar error de clave duplicada (código 11000)', () => {
      const duplicateError = {
        code: 11000,
        keyValue: { email: 'test@example.com' }
      };

      errorHandlerMiddleware(duplicateError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', duplicateError);
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error de conflicto: El campo 'email' con el valor 'test@example.com' ya existe."
      });
    });

    it('debe manejar error de clave duplicada sin keyValue definido', () => {
      const duplicateError = {
        code: 11000,
        keyValue: {}
      };

      errorHandlerMiddleware(duplicateError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', duplicateError);
      // Como no hay field, debería caer al manejo genérico
      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('debe manejar error de validación de Mongoose', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email es requerido' },
          password: { message: 'Password debe tener al menos 6 caracteres' }
        }
      };

      errorHandlerMiddleware(validationError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', validationError);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error de validación de datos',
        errors: [
          'Email es requerido',
          'Password debe tener al menos 6 caracteres'
        ]
      });
    });

    it('debe manejar CastError de Mongoose (ID malformado)', () => {
      const castError = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id-123'
      };

      errorHandlerMiddleware(castError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', castError);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error de formato: El valor 'invalid-id-123' no es válido para el campo '_id'."
      });
    });

    it('debe manejar CastError sin path', () => {
      const castError = {
        name: 'CastError',
        value: 'invalid-value'
      };

      errorHandlerMiddleware(castError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', castError);
      // Sin path, debería caer al manejo genérico
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERRORES DE LÓGICA DE NEGOCIO ====================
  describe('Errores de Lógica de Negocio', () => {
    it('debe manejar error 401 (no autorizado)', () => {
      const authError = new Error('Credenciales inválidas');
      (authError as any).statusCode = 401;

      errorHandlerMiddleware(authError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', authError);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Credenciales inválidas'
      });
    });

    it('debe manejar error 403 (prohibido)', () => {
      const forbiddenError = new Error('No tienes permisos para realizar esta acción');
      (forbiddenError as any).statusCode = 403;

      errorHandlerMiddleware(forbiddenError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No tienes permisos para realizar esta acción'
      });
    });

    it('debe manejar error 409 (conflicto)', () => {
      const conflictError = new Error('No se puede eliminar el usuario: tiene propiedades asignadas');
      (conflictError as any).statusCode = 409;

      errorHandlerMiddleware(conflictError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No se puede eliminar el usuario: tiene propiedades asignadas'
      });
    });

    it('debe manejar error 400 (validación personalizada)', () => {
      const validationError = new Error('Parámetros faltantes');
      (validationError as any).statusCode = 400;

      errorHandlerMiddleware(validationError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Parámetros faltantes'
      });
    });

    it('debe manejar error 404 (no encontrado)', () => {
      const notFoundError = new Error('Usuario no encontrado');
      (notFoundError as any).statusCode = 404;

      errorHandlerMiddleware(notFoundError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });

    it('NO debe manejar statusCode 500 en la sección de lógica de negocio', () => {
      const serverError = new Error('Error interno');
      (serverError as any).statusCode = 500;

      errorHandlerMiddleware(serverError, mockRequest as Request, mockResponse as Response, mockNext);

      // Debería caer al manejo genérico y mostrar mensaje genérico
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Ocurrió un error interno inesperado en el servidor.'
        })
      );
    });
  });

  // ==================== ERRORES GENÉRICOS ====================
  describe('Errores Genéricos', () => {
    it('debe manejar error genérico sin statusCode (500)', () => {
      process.env.NODE_ENV = 'production';
      const genericError = new Error('Algo salió mal');

      errorHandlerMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', genericError);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.'
      });
      // En producción, NO debe incluir stack
      expect(jsonMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.anything() })
      );
    });

    it('debe incluir stack trace en desarrollo', () => {
      process.env.NODE_ENV = 'development';
      const genericError = new Error('Algo salió mal');
      genericError.stack = 'Error: Algo salió mal\n    at ...\n';

      errorHandlerMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.',
        stack: genericError.stack
      });
    });

    it('debe incluir stack trace en test', () => {
      process.env.NODE_ENV = 'test';
      const genericError = new Error('Error de prueba');
      genericError.stack = 'Error: Error de prueba\n    at ...\n';

      errorHandlerMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.',
        stack: genericError.stack
      });
    });

    it('NO debe incluir stack trace en producción', () => {
      process.env.NODE_ENV = 'production';
      const genericError = new Error('Error de producción');
      genericError.stack = 'Error: Error de producción\n    at ...\n';

      errorHandlerMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('stack');
    });

    it('debe manejar error con statusCode personalizado pero mensaje genérico para 500', () => {
      process.env.NODE_ENV = 'production';
      const serverError = new Error('Este mensaje no se debe ver');
      (serverError as any).statusCode = 500;

      errorHandlerMiddleware(serverError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.'
      });
    });
  });

  // ==================== EDGE CASES ====================
  describe('Casos Especiales', () => {
    it('debe manejar error sin mensaje', () => {
      process.env.NODE_ENV = 'production';
      const errorWithoutMessage = {};

      errorHandlerMiddleware(errorWithoutMessage, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.'
      });
    });

    it('debe manejar string como error', () => {
      process.env.NODE_ENV = 'production';
      const stringError = 'Error en string';

      errorHandlerMiddleware(stringError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.'
      });
    });

    it('debe manejar error con propiedades vacías', () => {
      process.env.NODE_ENV = 'production';
      const emptyError = { message: '' };

      errorHandlerMiddleware(emptyError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Ocurrió un error interno inesperado en el servidor.'
      });
    });

    it('debe loguear todos los errores en consola', () => {
      const testError = new Error('Test error');
      
      errorHandlerMiddleware(testError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error capturado:', testError);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== INTEGRACIÓN DE MÚLTIPLES CAMPOS ====================
  describe('Integración de Errores Complejos', () => {
    it('debe priorizar error de clave duplicada sobre statusCode', () => {
      const mixedError = {
        code: 11000,
        keyValue: { username: 'johndoe' },
        statusCode: 400 // Este debería ser ignorado
      };

      errorHandlerMiddleware(mixedError, mockRequest as Request, mockResponse as Response, mockNext);

      // Debe manejar como error 11000, no como 400
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error de conflicto: El campo 'username' con el valor 'johndoe' ya existe."
      });
    });

    it('debe priorizar ValidationError sobre statusCode', () => {
      const mixedError = {
        name: 'ValidationError',
        errors: {
          name: { message: 'Nombre es requerido' }
        },
        statusCode: 500 // Este debería ser ignorado
      };

      errorHandlerMiddleware(mixedError, mockRequest as Request, mockResponse as Response, mockNext);

      // Debe manejar como ValidationError, no como 500
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error de validación de datos',
        errors: ['Nombre es requerido']
      });
    });

    it('debe priorizar CastError sobre statusCode', () => {
      const mixedError = {
        name: 'CastError',
        path: 'userId',
        value: 'abc123',
        statusCode: 404 // Este debería ser ignorado
      };

      errorHandlerMiddleware(mixedError, mockRequest as Request, mockResponse as Response, mockNext);

      // Debe manejar como CastError, no como 404
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error de formato: El valor 'abc123' no es válido para el campo 'userId'."
      });
    });
  });
});