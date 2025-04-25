import Joi from 'joi';

export const shippingSchema = Joi.object({
  address: Joi.string().min(5).max(255).required(),
  city: Joi.string().min(2).required(),
  zip: Joi.string().min(3).required(),
  country: Joi.string().min(2).required()
});

export const placeOrderSchema = Joi.object({
  itemProductIds: Joi.array().items(Joi.string().length(24)).optional(),
  paymentMethod: Joi.string().valid('card', 'paypal', 'cod').required(),
  shipping: shippingSchema.required()
});

export const updateOrderStatusSchema = Joi.object({
  id: Joi.string().length(24).required(),
  status: Joi.string().valid('placed', 'processing', 'shipped', 'delivered', 'cancelled').required()
});
