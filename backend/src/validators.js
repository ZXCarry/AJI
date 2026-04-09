const { z } = require('zod');

const nonEmptyText = z.string().trim().min(1, 'Pole nie może być puste');

const productCreateSchema = z.object({
  name: nonEmptyText,
  description: nonEmptyText,
  unit_price: z.number().positive('Cena musi być > 0'),
  unit_weight: z.number().positive('Waga musi być > 0'),
  category_id: z.number().int().positive(),
});

const productUpdateSchema = z.object({
  name: nonEmptyText.optional(),
  description: nonEmptyText.optional(),
  unit_price: z.number().positive().optional(),
  unit_weight: z.number().positive().optional(),
  category_id: z.number().int().positive().optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: 'Brak pól do aktualizacji',
});

const phoneSchema = z.string().trim().min(5).refine((v) => /^[0-9+\-\s()]+$/.test(v), {
  message: 'Telefon może zawierać tylko cyfry i znaki + - spacje nawiasy',
});

const orderItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive('Ilość musi być dodatnią liczbą całkowitą'),
  unit_price: z.number().positive('Cena jednostkowa w zamówieniu musi być > 0'),
  vat_rate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
});

const orderCreateSchema = z.object({
  user_name: nonEmptyText,
  email: z.string().trim().email('Niepoprawny email'),
  address: z.string().trim().min(5, 'Adres jest wymagany'),
  phone: phoneSchema,
  items: z.array(orderItemSchema).min(1, 'Zamówienie musi mieć przynajmniej jeden towar'),  
});

const orderPatchSchema = z.object({
  op: z.literal('replace'),
  path: z.literal('/status'),
  value: nonEmptyText, // nazwa statusu
});

const opinionCreateSchema = z.object({
  rating: z.number().int().min(1, 'Ocena musi być w zakresie 1-5').max(5, 'Ocena musi być w zakresie 1-5'),
  content: nonEmptyText,
});

module.exports = {
  productCreateSchema,
  productUpdateSchema,
  orderCreateSchema,
  orderPatchSchema,
  opinionCreateSchema,
};
