// 1. Importaciones necesarias
import { type Request, type Response, type NextFunction } from 'express'; 
import { registerUserService, loginUserService, getUserByIdService, getAllUsersService, createUserService, updateUserProfileService, updateUserByAdminService, deleteUserByIdService } from '../services/user.service';
import { type RegisterUserDto, type LoginUserDto, type CreateUserDto, type UpdateUserByAdminDto, type UpdateUserProfileDto, type UserListResponseDto } from '../dtos/user.dto';
import { serializeUser } from '../utils/user.serializer';
// --- Controladores Públicos ---

/**
 * @description Controlador para el registro público de nuevos usuarios (rol 'agente' por defecto).
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const registerUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const registerData: RegisterUserDto = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };

    const newUser = await registerUserService(registerData);
    const userResponse = serializeUser(newUser);
    return res.status(201).json({ message: 'Usuario registrado exitosamente', user: userResponse });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para la autenticación de usuarios.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const loginUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginData: LoginUserDto = {
      email: req.body.email,
      password: req.body.password
    };
    if (!loginData.email || !loginData.password) {
      return res.status(400).json({ message: 'El email y la contraseña son requeridos.' });
    }
    
    // El servicio devuelve { token, user } donde user es el modelo completo
    const { token, user } = await loginUserService(loginData.email, loginData.password);
    
    // Aquí serializamos para crear la respuesta segura
    const userResponse = serializeUser(user);
    
    return res.status(200).json({ 
      message: 'Login exitoso', 
      token,
      user: userResponse 
    });
  } catch (error) {
    // Los errores de login específicos (ej. "Credenciales inválidas") se manejarán con un código 401.
    return res.status(401).json({ message: (error as Error).message });
  }
};


// --- Controladores de Perfil de Usuario (`/me`) ---

/**
 * @description Controlador para obtener el perfil del usuario autenticado.
 * @param req La petición de Express, `req.user` es añadido por authMiddleware.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getUserProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    // El servicio devuelve el modelo completo o null
    const user = await getUserByIdService(userId);
    if (!user) {
      return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
    }
    
    // Aquí serializamos para crear la respuesta segura
    const userResponse = serializeUser(user);
    
    return res.status(200).json(userResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un usuario actualice su propio perfil.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const updateUserProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const updateData: UpdateUserProfileDto = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };

    Object.keys(updateData).forEach(
      key => (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    const updatedUser = await updateUserProfileService(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const userResponse = serializeUser(updatedUser);
    return res.status(200).json(userResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un usuario elimine su propia cuenta.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const deleteUserAccountController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await deleteUserByIdService(userId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};


// --- Controladores de Administración (Superadmin) ---

/**
 * @description Controlador para que un superadmin cree un nuevo usuario.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const createUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const createData: CreateUserDto = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role
    };

    const newUser = await createUserService(createData);
    const userResponse = serializeUser(newUser);
    return res.status(201).json({ message: 'Usuario creado exitosamente por el administrador', user: userResponse });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin obtenga todos los usuarios.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getAllUsersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getAllUsersService();
    const usersResponse = users.map(user => serializeUser(user));
    
    const response: UserListResponseDto = {
      users: usersResponse,
      total: usersResponse.length
    };
    
    return res.status(200).json({
      message: 'Usuarios obtenidos exitosamente',
      ...response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin obtenga un usuario por su ID.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const getUserByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'El ID del usuario es requerido.' });
    }
    
    // El servicio devuelve el modelo completo o null
    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Aquí serializamos para crear la respuesta segura
    const userResponse = serializeUser(user);
    
    return res.status(200).json(userResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin actualice cualquier usuario.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const updateUserByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'El ID del usuario es requerido.' });
    }

    const updateData: UpdateUserByAdminDto = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role
    };

    Object.keys(updateData).forEach(
      key => (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    const updatedUser = await updateUserByAdminService(id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const userResponse = serializeUser(updatedUser);
    return res.status(200).json(userResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Controlador para que un superadmin elimine cualquier usuario.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @param next La función para pasar al siguiente middleware de errores.
 */
export const deleteUserByAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'El ID del usuario es requerido.' });
    }
    await deleteUserByIdService(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};