import Joi from 'joi';
import { Item } from '../models/Item.js';

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string(),
  reportedBy: Joi.string()
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string(),
  reportedBy: Joi.string()
});

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const { status, category } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
   if (error) return res.status(400).json({ message: error.message });

   const item = await Item.create(value);
   res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
    });

   if (error) return res.status(400).json({ message: error.message });

   const doc = await Item.findByIdAndUpdate(
    req.params.id,
    { $set: value },
    { new: true, runValidators: true }
   );

   if (!doc) return res.status(404).json({ message: 'Item not found' });

   res.json({ item: doc });
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
