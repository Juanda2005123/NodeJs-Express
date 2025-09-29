import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Definimos una interfaz para el payload del JWT para tener un tipado fuerte
export interface JwtPayload {
  id: string;
  role: string;
}

// Extendemos la interfaz Request de Express para añadir nuestra propiedad 'user'
// Esto le dice a TypeScript que el objeto 'req' puede tener una propiedad 'user'.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware para verificar el token JWT de autenticación.
 * @param req - La petición de Express.
 * @param res - La respuesta de Express.
 * @param next - La función para pasar al siguiente middleware/controlador.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extraer el token de la cabecera 'Authorization'.
    // El formato estándar es "Bearer <token>"
    const authHeader = req.headers.authorization;

    // 2. Si no hay cabecera o no empieza con "Bearer ", el token no existe.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }

    // 3. Extraemos solo el token, quitando el "Bearer ".
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. Token no encontrado.' });
    }

    // 4. Verificamos el token.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Este es un error del servidor, no del cliente.
      throw new Error('La clave secreta del JWT no está configurada en el servidor.');
    }

    // 1. Verificamos el token y lo guardamos en una variable 'decoded'
    const decoded = jwt.verify(token, jwtSecret);

    // 2. Comprobamos si 'decoded' es un objeto y si tiene las propiedades que necesitamos.
    // Esta es la validación que TypeScript nos estaba pidiendo.
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 'role' in decoded) {
      
      // 3. Solo si la validación es exitosa, lo asignamos a req.user.
      // Ahora TypeScript está seguro de que decoded tiene la forma correcta.
      req.user = decoded as JwtPayload;

      // 4. Continuamos al siguiente paso.
      next();

    } else {
      // Si el payload del token no tiene la forma que esperamos, es un token inválido.
      throw new Error('Token inválido: el formato del payload es incorrecto.');
    }

  } catch (error) {
    // 7. Si jwt.verify() falla (token inválido, expirado, etc.), atrapamos el error.
    console.error('Error de autenticación:', error);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware para verificar el rol del usuario autenticado.
 * Debe usarse SIEMPRE DESPUÉS de authMiddleware.
 * @param allowedRoles - Un array de strings con los roles permitidos para la ruta.
 * @returns Una función de middleware de Express.
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Damos por hecho que authMiddleware ya se ejecutó y tenemos req.user
    const user = req.user!; // Usamos '!' porque estamos seguros de que no es undefined.

    // 3. Verificamos si el rol del usuario está en la lista de roles permitidos.
    if (allowedRoles.includes(user.role)) {
      // 4. ¡Éxito! El usuario tiene el rol correcto. Le damos el pase.
      next();
    } else {
      // 5. El usuario no tiene permisos. Le denegamos el acceso.
      return res.status(403).json({ message: 'Acceso prohibido. No tienes los permisos necesarios.' });
    }
  };
};