import Joi from 'joi';
import { Item } from '../models/Item.js';

const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const STATUSES = ['lost', 'found', 'claimed'];
const objectId = Joi.string().hex().length(24);

const createSchema = Joi.object({
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().allow('').max(1000),
  category: Joi.string().valid(...CATEGORIES),
  status: Joi.string().valid(...STATUSES),
  location: Joi.string().max(120),
  reportedBy: objectId
});

// Same fields as create, but nothing is required - this is a PATCH-style
// partial update, not a full replace - so at least one field must be given.
const updateSchema = Joi.object({
  title: Joi.string().min(1).max(120),
  description: Joi.string().allow('').max(1000),
  category: Joi.string().valid(...CATEGORIES),
  status: Joi.string().valid(...STATUSES),
  location: Joi.string().max(120),
  reportedBy: objectId
}).min(1);

const listQuerySchema = Joi.object({
  status: Joi.string().valid(...STATUSES),
  category: Joi.string().valid(...CATEGORIES)
});

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const { value, error } = listQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });

    // value only contains the whitelisted, validated keys (status/category),
    // so it's safe to pass straight to Mongo as the filter.
    const items = await Item.find(value)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email');
    res.json({ items });
  } catch (err) { next(err); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    res.status(201).json({ item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This item has already been reported at this location' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true })
      .populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This item has already been reported at this location' });
    }
    next(err);
  }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
