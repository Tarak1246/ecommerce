import { ProductModel } from '../../models/Product';
import { createProductSchema, updateProductSchema } from '../../validators/product';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/error';
import { IContext } from '../../types/context';
import { isValidObjectId } from '../../utils/validateObjectId';
import slugify from 'slugify';

const ALLOWED_SORT_FIELDS = ['price', 'createdAt', 'name'];

export const productResolvers = {
  Query: {
    getProduct: async (_: any, { slug }: { slug: string }) => {
      const product = await ProductModel.findOne({ slug, isActive: true });
      if (!product) throw new NotFoundError('Product not found');
      return product;
    },

    getProducts: async (_: any, { filter = {} }: any) => {
      const query: any = { isActive: true };

      if (filter.search) {
        query.name = { $regex: filter.search, $options: 'i' };
      }
      if (filter.category) {
        if (!isValidObjectId(filter.category)) throw new BadRequestError('Invalid category ID');
        query.category = filter.category;
      }
      if (filter.minPrice || filter.maxPrice) {
        query.price = {};
        if (filter.minPrice) query.price.$gte = filter.minPrice;
        if (filter.maxPrice) query.price.$lte = filter.maxPrice;
      }

      if (filter.limit && filter.limit < 0) throw new BadRequestError('Limit cannot be negative');
      if (filter.offset && filter.offset < 0) throw new BadRequestError('Offset cannot be negative');

      const sortField = filter.sortBy && ALLOWED_SORT_FIELDS.includes(filter.sortBy) ? filter.sortBy : 'createdAt';

      const products = await ProductModel.find(query)
        .sort({ [sortField]: 1 })
        .skip(filter.offset || 0)
        .limit(filter.limit || 10);

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

      const existingName = await ProductModel.findOne({ name: value.name });
      if (existingName) throw new BadRequestError('Product with this name already exists');

      const slug = slugify(value.name, { lower: true });

      const existingSlug = await ProductModel.findOne({ slug });
      if (existingSlug) throw new BadRequestError('Slug conflict, please choose a different name');

      if (value.stock === 0) {
        value.isActive = false;
      }

      const product = new ProductModel({
        ...value,
        slug
      });

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

      if (Object.keys(value).length === 0) {
        throw new BadRequestError('Update input cannot be empty');
      }

      if (value.stock !== undefined) {
        value.isActive = value.stock > 0;
      }

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
