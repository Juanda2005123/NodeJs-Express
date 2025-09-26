// 1. Importaciones necesarias
import { type Request, type Response } from 'express'; // Importamos los tipos de Express
import { createUserService } from '../services/user.service'; // Importamos nuestro servicio
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