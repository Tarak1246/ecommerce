import { CategoryModel } from '../../models/Category';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/error';
import { isValidObjectId } from '../../utils/validateObjectId';
import { IContext } from '../../types/context';
import slugify from 'slugify';

export const categoryResolvers = {
  Query: {
    getCategories: async () => {
      return await CategoryModel.find({ isActive: true }).sort({ createdAt: -1 });
    }
  },

  Mutation: {
    createCategory: async (_: any, { name }: { name: string }, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admins can create categories');
      }
    
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Category name cannot be empty');
      }
    
      const existing = await CategoryModel.findOne({ name });
      if (existing) throw new BadRequestError('Category already exists');
    
      const slug = slugify(name.trim(), { lower: true }); // Generate slug
      
      const category = new CategoryModel({ name: name.trim(), slug }); // save both name and slug
      await category.save();
    
      return category;
    },

    updateCategory: async (_: any, { id, name }: { id: string, name: string }, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admins can update categories');
      }
    
      if (!isValidObjectId(id)) {
        throw new BadRequestError('Invalid category ID');
      }
    
      const updated = await CategoryModel.findByIdAndUpdate(
        id,
        { name: name.trim(), slug: slugify(name.trim(), { lower: true }) },
        { new: true }
      );
    
      if (!updated) throw new NotFoundError('Category not found');
      return updated;
    },

    deleteCategory: async (_: any, { id }: { id: string }, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admins can delete categories');
      }

      if (!isValidObjectId(id)) {
        throw new BadRequestError('Invalid category ID');
      }

      const deleted = await CategoryModel.findByIdAndUpdate(id, { isActive: false });
      if (!deleted) throw new NotFoundError('Category not found');
      return true;
    }
  }
};
