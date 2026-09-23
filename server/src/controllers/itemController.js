import Joi from 'joi';
import { Item } from '../models/Item.js';

const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const STATUSES = ['lost', 'found', 'claimed'];

// Reused so a bad reportedBy value gets a validation error instead of
// falling through to a Mongoose CastError later.
const objectId = Joi.string().hex().length(24);

const createSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().max(1000).allow('').optional(),
  category: Joi.string().valid(...CATEGORIES).optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  location: Joi.string().max(120).allow('').optional(),
  reportedBy: objectId.optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(120),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid(...CATEGORIES),
  status: Joi.string().valid(...STATUSES),
  location: Joi.string().max(120).allow(''),
  reportedBy: objectId,
}).min(1); // reject an empty PATCH body outright

function publicItem(i) {
  return {
    id: i._id.toString(),
    title: i.title,
    description: i.description,
    category: i.category,
    status: i.status,
    location: i.location,
    reportedBy: i.reportedBy
      ? { id: i.reportedBy._id.toString(), name: i.reportedBy.name, email: i.reportedBy.email }
      : null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

const listQuerySchema = Joi.object({
  status: Joi.string().valid(...STATUSES),
  category: Joi.string().valid(...CATEGORIES),
}).unknown(true);

// GET /api/items
// GET /api/items?status=lost&category=electronics
export async function getAllItems(req, res, next) {
  try {
    const { value, error } = listQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });

    const filter = {};
    if (value.status) filter.status = value.status;
    if (value.category) filter.category = value.category;

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: items.map(publicItem) });
  } catch (err) { next(err); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(item) });
  } catch (err) { next(err); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    res.status(201).json({ item: publicItem(item) });
  } catch (err) {
    // Race-condition safety net: two requests can both pass a
    // pre-check and still collide on the unique index at insert time.
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This item has already been reported at that location' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(doc) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This item has already been reported at that location' });
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