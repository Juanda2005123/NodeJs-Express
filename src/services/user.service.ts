import UserModel, { type IUser } from '../models/User.model';

/**
 * Servicio para la lógica de negocio relacionada con los usuarios.
 */

/**ok
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