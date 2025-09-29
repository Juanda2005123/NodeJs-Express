// --- DTOs para Creación ---

/**
 * @description Define los campos requeridos para el registro público de un nuevo usuario.
 * El rol no se incluye aquí, ya que se asigna por defecto en el servicio.
 */
export interface RegisterUserDto {
  name:      string;
  email:     string;
  password:  string;
}

/**
 * @description Define los campos requeridos para que un superadmin cree un nuevo usuario.
 * Este DTO SÍ incluye el rol, ya que es una acción administrativa.
 */
export interface CreateUserDto {
  name:      string;
  email:     string;
  password:  string;
  role:      'superadmin' | 'agente';
}

// --- DTO para Autenticación ---

/**
 * @description Define los campos requeridos para el login de un usuario.
 */
export interface LoginUserDto {
  email:     string;
  password:  string;
}

// --- DTOs para Actualización ---

/**
 * @description Define los campos que un usuario puede actualizar de su propio perfil.
 * Todos los campos son opcionales. El rol está explícitamente omitido por seguridad.
 */
export interface UpdateUserProfileDto {
  name?:     string;
  email?:    string;
  password?: string;
}

/**
 * @description Define los campos que un superadmin puede actualizar de cualquier usuario.
 * Todos los campos son opcionales y SÍ se incluye el rol.
 */
export interface UpdateUserByAdminDto {
  name?:     string;
  email?:    string;
  password?: string;
  role?:     'superadmin' | 'agente';
}

/**
 * @description Define la forma segura de un objeto de Usuario que se envía al cliente.
 * Excluye campos sensibles como la contraseña.
 */
export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'agente';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @description Define la forma de la respuesta de autenticación (login y registro).
 */
export interface AuthResponseDto {
  token: string;
  user: UserResponseDto;
}

/**
 * @description Define la forma de la respuesta al listar usuarios.
 */
export interface UserListResponseDto {
  users: UserResponseDto[];
  total: number;
}