import Joi from 'joi';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const statuses = ['lost', 'found', 'claimed'];

const itemFields = {
  title: Joi.string().min(1).max(120),
  description: Joi.string().allow(''),
  category: Joi.string().valid(...categories),
  status: Joi.string().valid(...statuses),
  location: Joi.string().allow(''),
  reportedBy: Joi.string().hex().length(24)
};

const createSchema = Joi.object({
  ...itemFields,
  title: itemFields.title.required()
});

const updateSchema = Joi.object(itemFields).min(1);

const querySchema = Joi.object({
  category: Joi.string().valid(...categories),
  status: Joi.string().valid(...statuses)
}).unknown(false);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function populateReportedBy(query) {
  return query.populate('reportedBy', 'name email');
}

function handleDatabaseError(err, res, next) {
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'An item with this title already exists at this location' });
  }
  return next(err);
}

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const { value, error } = querySchema.validate(req.query, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const items = await populateReportedBy(Item.find(value).sort({ createdAt: -1 }));
    res.json({ items });
  } catch (err) { handleDatabaseError(err, res, next); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid item id' });

    const item = await populateReportedBy(Item.findById(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { handleDatabaseError(err, res, next); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    const populatedItem = await populateReportedBy(Item.findById(item._id));
    res.status(201).json({ item: populatedItem });
  } catch (err) { handleDatabaseError(err, res, next); }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid item id' });

    const { value, error } = updateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const populatedItem = await populateReportedBy(Item.findById(item._id));
    res.json({ item: populatedItem });
  } catch (err) { handleDatabaseError(err, res, next); }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid item id' });

    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { handleDatabaseError(err, res, next); }
}
