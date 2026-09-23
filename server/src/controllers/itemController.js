import Joi from 'joi';
import { Item } from '../models/Item.js';

// TODO: write a validation schema for create/update per README.md section 2.
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const STATUSES = ['lost', 'found', 'claimed'];

const createSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim(),
  category: Joi.string().valid(...CATEGORIES),
  status: Joi.string().valid(...STATUSES),
  location: Joi.string().trim(),
  reportedBy: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim(),
  category: Joi.string().valid(...CATEGORIES),
  status: Joi.string().valid(...STATUSES),
  location: Joi.string().trim(),
  reportedBy: Joi.string().hex().length(24)
}).min(1);

const filterSchema = Joi.object({
  status: Joi.string().valid(...STATUSES),
  category: Joi.string().valid(...CATEGORIES)
});

function publicItem(i) {
  return {
    id: i._id.toString(),
    title: i.title,
    description: i.description,
    category: i.category,
    status: i.status,
    location: i.location,
    reportedBy: i.reportedBy,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt
  };
}

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    // TODO
    const { value, error } = filterSchema.validate(req.query, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const items = await Item.find(value)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: items.map(publicItem) });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    // TODO
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(item) });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    // TODO
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    res.status(201).json({ item: publicItem(item) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Item already reported at this location' });
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    // TODO
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(doc) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Item already reported at this location' });
    next(err);
  }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    // TODO
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
