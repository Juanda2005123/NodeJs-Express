// 1. Importaciones necesarias
import { type Request, type Response } from 'express'; // Importamos los tipos de Express
import { createUserService, loginUserService, getUserByIdService } from '../services/user.service'; // Importamos nuestro servicio
import { type IUser } from '../models/User.model'; // Importamos el tipo para el cuerpo de la respuesta

/**
 * Controlador para manejar la petición de registro de un nuevo usuario.
 * Es una función asíncrona porque debe esperar la respuesta del servicio.
 *
 * @param req - El objeto de la Petición (Request) de Express. Contiene la información enviada por el cliente.
 * @param res - El objeto de la Respuesta (Response) de Express. Lo usamos para enviar una respuesta al cliente.
 */
export const registerUserController = async (req: Request, res: Response) => {
  try {
    // 2. Extracción de Datos: Obtenemos los datos del usuario del cuerpo de la petición.
    // express.json() (configurado en index.ts) ya ha convertido el JSON del cliente en un objeto JavaScript.
    const userData: IUser = req.body;

    // 3. Llamada al Servicio: Pasamos los datos al servicio para que ejecute la lógica de negocio.
    // El controlador NO sabe cómo se crea un usuario, solo delega esa responsabilidad.
    const newUser = await createUserService(userData);

    // 4. Formateo de la Respuesta de Éxito:
    // ¡NUNCA devuelvas la contraseña! Creamos un objeto de respuesta seguro y limpio.
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    // 5. Envío de la Respuesta HTTP de Éxito:
    // Usamos el código de estado 201 Created, que es el estándar para la creación exitosa de un recurso.
    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userResponse
    });

  } catch (error: any) {
    // 6. Manejo de Errores: Si el servicio lanza un error, lo atrapamos aquí.
    
    // Mejor práctica avanzada: Revisar el tipo de error para dar una respuesta más específica.
    // El código 11000 es el error de "clave duplicada" de MongoDB (en nuestro caso, el email).
    if (error.code === 11000) {
      return res.status(409).json({ message: `Error: El email '${error.keyValue.email}' ya está en uso.` });
    }

    // Para cualquier otro error, enviamos un error genérico del servidor.
    console.error('Error en registerUserController:', error); // Es buena práctica registrar el error en la consola del servidor.
    return res.status(500).json({ message: 'Error interno del servidor al registrar el usuario' });
  }
};

export const loginUserController = async (req: Request, res: Response) => {
  try {
    // 1. Extraer email y contraseña del cuerpo de la petición.
    const { email, password } = req.body;

    // 2. Validar que los datos necesarios fueron enviados.
    if (!email || !password) {
      return res.status(400).json({ message: 'El email y la contraseña son requeridos.' });
    }

    // 3. Llamar al servicio de login.
    const data = await loginUserService(email, password);

    // 4. Si el login es exitoso, enviar la respuesta con el token.
    return res.status(200).json({
      message: 'Login exitoso',
      token: data.token,
      user: data.user
    });

  } catch (error: any) {
    // 5. Si el servicio lanza un error (ej. "Credenciales inválidas"), lo atrapamos.
    // Damos una respuesta genérica de "No autorizado".
    return res.status(401).json({ message: error.message || 'Error de autenticación' });
  }
};

/**
 * Controlador para obtener el perfil del usuario actualmente autenticado.
 */
export const getUserProfileController = async (req: Request, res: Response) => {
  try {
    // 1. ¡La Magia del Middleware!
    // Gracias al authMiddleware, sabemos con certeza que req.user existe y tiene el ID del usuario.
    // Usamos el 'Non-null assertion operator' (!) porque estamos seguros de que no será undefined.
    const userId = req.user!.id;

    // 2. Llamamos al servicio para obtener los datos del usuario.
    const userProfile = await getUserByIdService(userId);

    // 3. Manejamos el caso (muy improbable) de que no se encuentre el usuario.
    if (!userProfile) {
      return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
    }

    // 4. Enviamos el perfil del usuario como respuesta.
    return res.status(200).json(userProfile);

  } catch (error) {
    console.error('Error en getUserProfileController:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener el perfil.' });
  }
};