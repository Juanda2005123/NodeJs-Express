import { Schema, model } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Contrato que define la estructura de un usuario en TypeScript
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'agente';
  createdAt?: Date; // Opcional, porque se añade después de la creación
  updatedAt?: Date; // Opcional, porque se añade después de la creación
}

// Schema de Mongoose, el plano para la base de datos
const userSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    required: [true, 'El email es obligatorio'], 
    unique: true, 
    trim: true, // Limpia espacios en blanco al inicio y al final
    lowercase: true // Guarda el email en minúsculas
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'] 
  },
  role: { 
    type: String, 
    enum: {
      values: ['superadmin', 'agente'],
      message: '{VALUE} no es un rol válido'
    },
    required: true 
  }
}, {
  timestamps: true // Crea automáticamente los campos createdAt y updatedAt
});

// Hook (middleware) de Mongoose: Se ejecuta ANTES de que un documento se guarde
userSchema.pre('save', async function(next) {
  // Si la contraseña no ha sido modificada, pasamos al siguiente middleware
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generamos un "salt" y hasheamos la contraseña
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Creamos el modelo a partir del schema y lo exportamos
const UserModel = model<IUser>('User', userSchema);

export default UserModel;