import Joi from 'joi';
import { Item, ITEM_CATEGORIES, ITEM_STATUSES } from '../models/Item.js';

const createSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(1000),
  category: Joi.string().valid(...ITEM_CATEGORIES),
  status: Joi.string().valid(...ITEM_STATUSES),
  location: Joi.string().trim().max(100),
  reportedBy: Joi.string().hex().length(24)
});

// Same rules as create, but title becomes optional and at least one field must be sent.
const updateSchema = createSchema.fork(['title'], (field) => field.optional()).min(1);

// Query filters for the list endpoint. Only these keys, only these plain string values, ever reach Item.find().
const filterSchema = Joi.object({
  status: Joi.string().valid(...ITEM_STATUSES),
  category: Joi.string().valid(...ITEM_CATEGORIES)
});

// Turns DB errors caused by bad client input into 4xx; anything else goes to the global 500 handler.
function handleDbError(err, res, next) {
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}` });
  if (err.code === 11000) return res.status(409).json({ message: 'An item with this title is already reported at this location' });
  next(err);
}

// GET /api/items?status=lost&category=electronics
export async function getAllItems(req, res, next) {
  try {
    const { value: filter, error } = filterSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    // Only name/email: without the field list, populate would also return the user's password hash.
    const items = await Item.find(filter).sort({ createdAt: -1 }).populate('reportedBy', 'name email').lean();
    res.json({ items });
  } catch (err) { handleDbError(err, res, next); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email').lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { handleDbError(err, res, next); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    res.status(201).json({ item });
  } catch (err) { handleDbError(err, res, next); }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { handleDbError(err, res, next); }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { handleDbError(err, res, next); }
}
