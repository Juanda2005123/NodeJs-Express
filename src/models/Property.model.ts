import { Schema, model, Types } from 'mongoose';

// 1. Interfaz TypeScript para definir la estructura de una Propiedad
export interface IProperty {
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number; // en metros cuadrados
  imageUrls?: string[];
  owner: Types.ObjectId; // Referencia al ID del usuario propietario
}

// 2. Schema de Mongoose
const propertySchema = new Schema<IProperty>({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria']
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio']
  },
  location: {
    type: String,
    required: [true, 'La ubicación es obligatoria']
  },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  area: { type: Number, required: [true, 'El área es obligatoria'] },
  imageUrls: {
    type: [String], // Un array de strings
    default: []
  },
  // 3. El campo clave para la relación
  owner: {
    type: Schema.Types.ObjectId, // El tipo de dato para IDs de MongoDB
    ref: 'User',                 // Le dice a Mongoose que este ID se refiere a un documento en la colección 'User'
    required: true
  }
}, {
  timestamps: true // Añade createdAt y updatedAt
});

// 4. Creamos y exportamos el modelo
const PropertyModel = model<IProperty>('Property', propertySchema);

export default PropertyModel;