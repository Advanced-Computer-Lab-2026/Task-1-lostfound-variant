import { Item } from '../models/Item.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.
const createItemSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow('', null),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().trim().allow('', null),
  reportedBy: Joi.string(),
});

const updateItemSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim().allow('', null),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().trim().allow('', null),
  reportedBy: Joi.string(),
}).min(1);
// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const { status, category, location } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItemById(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { error, value } = createItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const item = await Item.create(value);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title already exists at this location.' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { error, value } = updateItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const item = await Item.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    }).populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title already exists at this location.' });
    }
     next(err);
     }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) { next(err); }
}
