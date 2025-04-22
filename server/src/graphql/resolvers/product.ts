import { ProductModel } from '../../models/Product';
import { createProductSchema, updateProductSchema } from '../../validators/product';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/error';
import { IContext } from '../../types/context';
import { isValidObjectId } from '../../utils/validateObjectId';

export const productResolvers = {
  Query: {
    getProduct: async (_: any, { slug }: { slug: string }) => {
      const product = await ProductModel.findOne({ slug, isActive: true });
      if (!product) throw new NotFoundError('Product not found');
      return product;
    },

    getProducts: async (_: any, { filter }: any) => {
      const query: any = { isActive: true };

      if (filter?.search) {
        query.name = { $regex: filter.search, $options: 'i' };
      }
      if (filter?.category) query.category = filter.category;
      if (filter?.minPrice || filter?.maxPrice) {
        query.price = {};
        if (filter.minPrice) query.price.$gte = filter.minPrice;
        if (filter.maxPrice) query.price.$lte = filter.maxPrice;
      }

      const products = await ProductModel.find(query)
        .sort(filter?.sortBy ? { [filter.sortBy]: 1 } : { createdAt: -1 })
        .skip(filter?.offset || 0)
        .limit(filter?.limit || 10)

      return products;
    }
  },

  Mutation: {
    createProduct: async (_: any, { input }: any, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admins can create products');
      }

      const { error, value } = createProductSchema.validate(input);
      if (error) throw new BadRequestError(error.details[0].message);

      const existing = await ProductModel.findOne({ name: value.name });
      if (existing) throw new BadRequestError('Product with this name already exists');

      const product = new ProductModel(value);
      await product.save();

      return product;
    },

    updateProduct: async (_: any, { id, input }: any, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admins can update products');
      }

      if (!isValidObjectId(id)) {
        throw new BadRequestError('Invalid product ID');
      }

      const { error, value } = updateProductSchema.validate(input);
      if (error) throw new BadRequestError(error.details[0].message);

      const updated = await ProductModel.findByIdAndUpdate(id, value, { new: true });
      if (!updated) throw new NotFoundError('Product not found');
      return updated;
    },

    deleteProduct: async (_: any, { id }: any, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admins can delete products');
      }

      if (!isValidObjectId(id)) {
        throw new BadRequestError('Invalid product ID');
      }

      const deleted = await ProductModel.findByIdAndUpdate(id, { isActive: false });
      if (!deleted) throw new NotFoundError('Product not found');
      return true;
    }
  }
};
