import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

productSchema.virtual('id').get(function () {
    return (this._id as mongoose.Types.ObjectId).toHexString();
});

productSchema.set('toObject', { virtuals: true });
productSchema.set('toJSON', { virtuals: true });

productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});


export const ProductModel = mongoose.model<IProduct>('Product', productSchema);
