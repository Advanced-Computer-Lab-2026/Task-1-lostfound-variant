import { Item } from '../models/Item.js';
import Joi from 'joi';
const itemSchema = Joi.object({
  title: Joi.string().required(),

  description: Joi.string().optional(),

  category: Joi.string()
    .valid('electronics', 'clothing', 'documents', 'accessories', 'other')
    .default('other'),

  status: Joi.string()
    .valid('lost', 'found', 'claimed')
    .default('lost'),

  location: Joi.string().optional(),

  reportedBy: Joi.string().optional()
});
// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const items = await Item.find(filter)
      .populate('reportedBy');

    res.status(200).json(items);
  } catch (err) {
    next(err);}
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
   const item = await Item.findById(req.params.id)
  .populate('reportedBy');

if (!item) {
  return res.status(404).json({ message: 'Item not found' });
}

res.status(200).json(item);
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
  const { error, value } = itemSchema.validate(req.body);

if (error) {
  return res.status(400).json({ message: error.details[0].message });
}

const item = await Item.create(value);

res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
   const { error, value } = itemSchema.validate(req.body);

if (error) {
  return res.status(400).json({ message: error.details[0].message });
}

const item = await Item.findByIdAndUpdate(
  req.params.id,
  value,
  { new: true, runValidators: true }
).populate('reportedBy');

if (!item) {
  return res.status(404).json({ message: 'Item not found' });
}

res.status(200).json(item);
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
  const item = await Item.findByIdAndDelete(req.params.id);

if (!item) {
  return res.status(404).json({ message: 'Item not found' });
}

res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) { next(err); }
}
