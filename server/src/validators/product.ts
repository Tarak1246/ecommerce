import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().positive().required(),
  stock: Joi.number().min(0).required(),
  category: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).optional()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().optional(),
  stock: Joi.number().min(0).optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(Joi.string().uri()).optional()
});
