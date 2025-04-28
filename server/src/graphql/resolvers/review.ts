// graphql/resolvers/review.ts
import { ReviewModel } from '../../models/Review';
import { ProductModel } from '../../models/Product';
import { IContext } from '../../types/context';
import { BadRequestError, NotFoundError } from '../../utils/error';
import { isValidObjectId } from '../../utils/validateObjectId';

async function updateProductAverageRating(productId: string) {
  const reviews = await ReviewModel.find({ productId });
  const totalReviews = reviews.length;

  const avgRating = totalReviews
    ? reviews.reduce((acc, cur) => acc + cur.rating, 0) / totalReviews
    : 0;

  await ProductModel.findByIdAndUpdate(productId, { averageRating: avgRating });
}

export const reviewResolvers = {
  Query: {
    getProductReviews: async (_: any, { productId }: { productId: string }) => {
      if (!isValidObjectId(productId)) {
        throw new BadRequestError('Invalid product ID');
      }
      return await ReviewModel.find({ productId });
    },
  },

  Mutation: {
    addReview: async (
      _: any,
      { productId, rating, comment }: { productId: string; rating: number; comment?: string },
      context: IContext
    ) => {
      if (!context.user) throw new BadRequestError('Not authenticated');
      if (!isValidObjectId(productId)) throw new BadRequestError('Invalid product ID');

      const existing = await ReviewModel.findOne({
        productId,
        userId: context.user.id,
      });

      if (existing) {
        throw new BadRequestError('You have already reviewed this product');
      }

      const review = await ReviewModel.create({
        productId,
        userId: context.user.id,
        rating,
        comment,
      });

      await updateProductAverageRating(productId);
      return review;
    },

    updateReview: async (
      _: any,
      { id, rating, comment }: { id: string; rating?: number; comment?: string },
      context: IContext
    ) => {
      if (!context.user) throw new BadRequestError('Not authenticated');
      if (!isValidObjectId(id)) throw new BadRequestError('Invalid review ID');

      const review = await ReviewModel.findById(id);
      if (!review) throw new NotFoundError('Review not found');

      if (review.userId.toString() !== context.user.id) {
        throw new BadRequestError('You are not authorized to update this review');
      }

      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;

      await review.save();
      await updateProductAverageRating(review.productId.toString());
      return review;
    },

    deleteReview: async (_: any, { id }: { id: string }, context: IContext) => {
      if (!context.user) throw new BadRequestError('Not authenticated');
      if (!isValidObjectId(id)) throw new BadRequestError('Invalid review ID');

      const review = await ReviewModel.findById(id);
      if (!review) throw new NotFoundError('Review not found');

      if (review.userId.toString() !== context.user.id) {
        throw new BadRequestError('You are not authorized to delete this review');
      }

      await ReviewModel.findByIdAndDelete(id);
      await updateProductAverageRating(review.productId.toString());
      return true;
    },
  },
};
