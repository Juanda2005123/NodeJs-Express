import { Schema, model, Types } from 'mongoose';

// 1. Interfaz TypeScript para definir la estructura de una Tarea
export interface ITask {
  title: string;
  description: string;
  isCompleted: boolean;
  property: Types.ObjectId; // Referencia a la Propiedad a la que pertenece
  assignedTo: Types.ObjectId; // Referencia al Usuario (agente) asignado
}

// 2. Schema de Mongoose
const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: [true, 'El título de la tarea es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción de la tarea es obligatoria']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  // 3. Las relaciones clave
  property: {
    type: Schema.Types.ObjectId,
    ref: 'Property', // Referencia al modelo 'Property'
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo 'User'
    required: true
  }
}, {
  timestamps: true
});

// 4. Creamos y exportamos el modelo
const TaskModel = model<ITask>('Task', taskSchema);

export default TaskModel;