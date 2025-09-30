// tests/unit/middlewares/auth.middleware.test.ts

// Mock dotenv ANTES de cualquier import
jest.mock('dotenv', () => ({
  __esModule: true,
  default: {
    config: jest.fn(),
  },
  config: jest.fn(),
}));

// Mock jwt
jest.mock('jsonwebtoken');

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authMiddleware, checkRole, JwtPayload } from '../../../src/middlewares/auth.middleware';

const mockedJwt = jest.mocked(jwt);

// Mock process.env
const originalEnv = process.env;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.env
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret-key'
    };

    // Setup response mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==================== AUTH MIDDLEWARE ====================
  describe('authMiddleware', () => {
    it('debe autenticar usuario con token válido', () => {
      const mockPayload: JwtPayload = {
        id: '507f1f77bcf86cd799439011',
        role: 'agente'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-token-123', 'test-secret-key');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('debe rechazar petición sin header Authorization', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso denegado. No se proporcionó un token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar header sin "Bearer "', () => {
      mockRequest.headers = {
        authorization: 'invalid-format-token'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso denegado. No se proporcionó un token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar header "Bearer " sin token', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso denegado. Token no encontrado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar token inválido/malformado', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Token inválido o expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar token expirado', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Token inválido o expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar error si JWT_SECRET no está configurado', () => {
      delete process.env.JWT_SECRET;

      mockRequest.headers = {
        authorization: 'Bearer some-token'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Token inválido o expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar payload sin campo "id"', () => {
      const invalidPayload = {
        role: 'agente'
        // Falta 'id'
      };

      mockRequest.headers = {
        authorization: 'Bearer token-without-id'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(invalidPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Token inválido o expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar payload sin campo "role"', () => {
      const invalidPayload = {
        id: '507f1f77bcf86cd799439011'
        // Falta 'role'
      };

      mockRequest.headers = {
        authorization: 'Bearer token-without-role'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(invalidPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Token inválido o expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar payload que es string en lugar de object', () => {
      mockRequest.headers = {
        authorization: 'Bearer simple-string-token'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue('simple-string-payload');

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Token inválido o expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe autenticar superadmin correctamente', () => {
      const mockPayload: JwtPayload = {
        id: '507f1f77bcf86cd799439012',
        role: 'superadmin'
      };

      mockRequest.headers = {
        authorization: 'Bearer superadmin-token'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockRequest.user!.role).toBe('superadmin');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ==================== CHECK ROLE MIDDLEWARE ====================
  describe('checkRole', () => {
    beforeEach(() => {
      // Setup authenticated user for role tests
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        role: 'agente'
      };
    });

    it('debe permitir acceso a usuario con rol correcto', () => {
      const middleware = checkRole(['agente']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('debe permitir acceso a superadmin para ruta de agentes', () => {
      mockRequest.user!.role = 'superadmin';
      const middleware = checkRole(['superadmin', 'agente']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('debe denegar acceso a agente en ruta solo para superadmin', () => {
      mockRequest.user!.role = 'agente';
      const middleware = checkRole(['superadmin']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso prohibido. No tienes los permisos necesarios.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso a superadmin en ruta solo para agentes', () => {
      mockRequest.user!.role = 'superadmin';
      const middleware = checkRole(['agente']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso prohibido. No tienes los permisos necesarios.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe permitir acceso con múltiples roles válidos', () => {
      mockRequest.user!.role = 'agente';
      const middleware = checkRole(['superadmin', 'agente', 'admin']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('debe denegar acceso con rol no incluido en múltiples roles', () => {
      mockRequest.user!.role = 'agente';
      const middleware = checkRole(['admin', 'moderator']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso prohibido. No tienes los permisos necesarios.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe funcionar con array de un solo rol', () => {
      mockRequest.user!.role = 'superadmin';
      const middleware = checkRole(['superadmin']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('debe funcionar correctamente con roles case-sensitive', () => {
      mockRequest.user!.role = 'agente';
      const middleware = checkRole(['AGENTE']); // Diferente case

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso prohibido. No tienes los permisos necesarios.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe('authMiddleware + checkRole (Integration)', () => {
    it('debe funcionar en conjunto: auth + role válido', () => {
      const mockPayload: JwtPayload = {
        id: '507f1f77bcf86cd799439011',
        role: 'superadmin'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      // Simulate middleware chain
      authMiddleware(mockRequest as Request, mockResponse as Response, () => {
        // Auth passed, now check role
        const roleMiddleware = checkRole(['superadmin']);
        roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('debe fallar en conjunto: auth válido pero rol insuficiente', () => {
      const mockPayload: JwtPayload = {
        id: '507f1f77bcf86cd799439011',
        role: 'agente'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      // Simulate middleware chain
      authMiddleware(mockRequest as Request, mockResponse as Response, () => {
        // Auth passed, now check role (should fail)
        const roleMiddleware = checkRole(['superadmin']);
        roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockRequest.user).toEqual(mockPayload);
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Acceso prohibido. No tienes los permisos necesarios.'
      });
    });
  });
});