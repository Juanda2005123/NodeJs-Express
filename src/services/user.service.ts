import UserModel, { type IUser } from '../models/User.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv'; 
/**
 * Servicio para la lógica de negocio relacionada con los usuarios.
 */

dotenv.config();

/**
 * Crea un nuevo usuario en la base de datos.
 * @param userData - Un objeto que cumple con la interfaz IUser, conteniendo los datos del nuevo usuario.
 * @returns El documento del usuario recién guardado en la base de datos.
 * @throws Lanza un error si la operación de guardado falla (ej. por un email duplicado).
 */
export const createUserService = async (userData: IUser) => {
  try {
    // 1. Creamos una nueva instancia del modelo de usuario con los datos recibidos.
    // Esto es un documento de Mongoose en memoria, aún no está en la base de datos.
    const newUser = new UserModel(userData);

    // 2. Guardamos el documento en la base de datos.
    // Esta es una operación asíncrona, por eso usamos 'await'.
    // ¡JUSTO ANTES de que esta línea se complete, el hook 'pre.save' de nuestro modelo se ejecutará para encriptar la contraseña!
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
 * Servicio para autenticar a un usuario y generar un token JWT.
 * @param email - El email del usuario que intenta iniciar sesión.
 * @param password - La contraseña en texto plano que envía el usuario.
 * @returns Un objeto con el token y los datos del usuario si las credenciales son correctas.
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
      throw new Error('Credenciales inválidas');
    }

    // 3. Comparar la contraseña enviada con la contraseña hasheada en la base de datos.
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // 4. Si las contraseñas no coinciden, lanzamos el mismo error genérico.
    if (!isPasswordMatch) {
      throw new Error('Credenciales inválidas');
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

    // 6. Devolvemos el token y la información del usuario (sin la contraseña).
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return { token, user: userResponse };

  } catch (error) {
    // Relanzamos el error para que el controlador lo maneje.
    throw error;
  }
};

/**
 * Busca un único usuario por su ID en la base de datos.
 * @param id - El ID del usuario a buscar.
 * @returns El documento del usuario encontrado (sin la contraseña) o null si no se encuentra.
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

    // 3. NUNCA devolvemos la contraseña. Creamos un objeto de respuesta seguro.
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return userResponse;

  } catch (error) {
    // Relanzamos el error para que el controlador lo maneje.
    throw error;
  }
};