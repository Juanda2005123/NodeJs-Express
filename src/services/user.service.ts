import UserModel from '../models/User.model';
import PropertyModel from '../models/Property.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv'; 
import { type RegisterUserDto, type CreateUserDto, type UpdateUserByAdminDto, type UpdateUserProfileDto } from '../dtos/user.dto';

/**
 * Servicio para la lógica de negocio relacionada con los usuarios.
 */

dotenv.config();

/**
 * Registra un nuevo usuario con rol 'agente' en la base de datos.
 * @param userData - Un objeto que cumple con el DTO RegisterUserDto, conteniendo los datos del nuevo usuario.
 * @returns El documento del usuario recién guardado en la base de datos.
 * @throws Lanza un error si la operación de guardado falla (ej. por un email duplicado).
 */
export const registerUserService = async (userData: RegisterUserDto) => {
  try {
    // ¡Corrección de Seguridad! Forzamos el rol a 'agente'.
    const userDataWithRole = {
      ...userData,
      role: 'agente' as const // 'as const' ayuda a TypeScript a entender que es un valor fijo
    };

    const newUser = new UserModel(userDataWithRole);
    await newUser.save();

    // 3. Devolvemos el documento completo del usuario guardado.
    return newUser;

  } catch (error) {
    // 4. Si 'newUser.save()' falla (por ejemplo, por la restricción 'unique' del email),
    // Mongoose lanzará un error. Atrapamos ese error aquí.
    // En lugar de manejarlo, simplemente lo "relanzamos" hacia arriba.
    // Esto permite que la capa que llamó al servicio (el controlador) decida cómo informar al cliente final.
    throw error;
  }
};

/**
 * Servicio para crear un nuevo usuario (acción de administrador).
 * A diferencia del registro, esta función respeta el rol proporcionado.
 * @param userData - Un objeto que cumple con el DTO CreateUserDto.
 * @returns El documento del usuario recién guardado.
 * @throws Lanza un error si la operación falla (ej. email duplicado).
 */
export const createUserService = async (userData: CreateUserDto) => {
  try {
    const newUser = new UserModel(userData);
    await newUser.save();
    return newUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Servicio para autenticar a un usuario y generar un token JWT.
 * @param email - El email del usuario que intenta iniciar sesión.
 * @param password - La contraseña en texto plano que envía el usuario.
 * @returns Un objeto con el token y el modelo de usuario completo.
 * @throws Lanza un error si el usuario no se encuentra o la contraseña es incorrecta.
 */
export const loginUserService = async (email: string, password: string) => {
  try {
    // 1. Buscar al usuario por su email
    // Usamos .select('+password') para incluir explícitamente la contraseña, que por defecto podría estar oculta.
    const user = await UserModel.findOne({ email }).select('+password');

    // 2. Si el usuario no existe, lanzamos un error de autenticación.
    // ¡Importante! No decimos "email no encontrado" para no dar pistas a posibles atacantes.
    if (!user) {
      const error = new Error('Credenciales inválidas');
      (error as any).statusCode = 401;
      throw error;
    }

    // 3. Comparar la contraseña enviada con la contraseña hasheada en la base de datos.
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // 4. Si las contraseñas no coinciden, lanzamos el mismo error genérico.
    if (!isPasswordMatch) {
      const error = new Error('Credenciales inválidas');
      (error as any).statusCode = 401;
      throw error;
    }

    // 5. Si todo es correcto, generamos el token JWT.
    const payload = {
      id: user._id,
      role: user.role
    };

    // Leemos el secreto del JWT desde las variables de entorno. ¡NUNCA lo pongas directamente en el código!
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('La clave secreta del JWT no está configurada.');
    }

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' }); // El token expirará en 1 hora

    // 6. Devolvemos el token y el modelo completo del usuario (el controller se encarga de serializar).
    return { token, user };

  } catch (error) {
    // Relanzamos el error para que el controlador lo maneje.
    throw error;
  }
};

/**
 * Busca un único usuario por su ID en la base de datos.
 * @param id - El ID del usuario a buscar.
 * @returns El documento completo del usuario (modelo de Mongoose) o null si no se encuentra.
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getUserByIdService = async (id: string) => {
  try {
    // 1. Usamos el método .findById() que nos regala Mongoose.
    const user = await UserModel.findById(id);

    // 2. Si no se encuentra ningún usuario con ese ID, devolvemos null.
    if (!user) {
      return null;
    }

    // 3. Devolvemos el modelo completo (el controller se encarga de serializar)
    return user;

  } catch (error) {
    // Relanzamos el error para que el controlador lo maneje.
    throw error;
  }
};


/**
 * Servicio para obtener una lista de todos los usuarios.
 * @returns Un array con todos los documentos de usuario (sin la contraseña).
 * @throws Lanza un error si la operación de búsqueda falla.
 */
export const getAllUsersService = async () => {
    try {
        const users = await UserModel.find().select('-password'); // Excluimos la contraseña
        return users;

    } catch (error) {
        throw error;
    }
};

/**
 * @description Servicio para que un usuario actualice su propio perfil.
 * @param userId - El ID del usuario que se va a actualizar.
 * @param updateData - Un objeto que cumple con el DTO UpdateUserProfileDto.
 * @returns El documento del usuario actualizado (sin la contraseña) o null si no se encuentra.
 */
export const updateUserProfileService = async (userId: string, updateData: UpdateUserProfileDto) => {
  try {
    
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    return updatedUser;

  } catch (error) {
    throw error;
  }
};

/**
 * @description Servicio para que un administrador actualice cualquier usuario.
 * @param userId - El ID del usuario que se va a actualizar.
 * @param updateData - Un objeto que cumple con el DTO UpdateUserByAdminDto (puede incluir el rol).
 * @returns El documento del usuario actualizado (sin la contraseña) o null si no se encuentra.
 */
export const updateUserByAdminService = async (userId: string, updateData: UpdateUserByAdminDto) => {
  try {
    // Si el admin envía una nueva contraseña, la hasheamos.
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // A diferencia del servicio de perfil, aquí NO eliminamos el campo 'role'.
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * @description Servicio para eliminar un usuario por su ID.
 * Incluye validación de dependencias: no permite eliminar si tiene propiedades asignadas.
 * @param userId - El ID del usuario a eliminar.
 * @returns El documento del usuario que fue eliminado o null si no se encontró.
 * @throws Lanza un error si el usuario tiene propiedades asignadas.
 */
export const deleteUserByIdService = async (userId: string) => {
  try {
    // VALIDACIÓN DE DEPENDENCIAS: Verificar si el usuario tiene propiedades
    const userProperties = await PropertyModel.find({ owner: userId }).limit(1);
    
    if (userProperties.length > 0) {
      const error = new Error('No se puede eliminar el usuario: tiene propiedades asignadas. Elimine primero todas sus propiedades.');
      (error as any).statusCode = 409; // Conflict
      throw error;
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return null;
    }

    return deletedUser;
  } catch (error) {
    throw error;
  }
};