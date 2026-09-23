import Joi from 'joi';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const STATUSES = ['lost', 'found', 'claimed'];

// Section 2: Joi validation schemas
const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow('', null).max(500),
  category: Joi.string().valid(...CATEGORIES).default('other'),
  status: Joi.string().valid(...STATUSES).default('lost'),
  location: Joi.string().trim().allow('', null).max(120),
  reportedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId').allow('', null)
});

const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100),
  description: Joi.string().trim().allow('', null).max(500),
  category: Joi.string().valid(...CATEGORIES),
  status: Joi.string().valid(...STATUSES),
  location: Joi.string().trim().allow('', null).max(120),
  reportedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId').allow('', null)
}).min(1);

function publicItem(item) {
  if (!item) return null;
  const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  const id = obj._id ? obj._id.toString() : obj.id;
  let reportedBy = obj.reportedBy;

  if (reportedBy && typeof reportedBy === 'object' && reportedBy._id) {
    reportedBy = {
      id: reportedBy._id.toString(),
      name: reportedBy.name,
      email: reportedBy.email
    };
  } else if (reportedBy) {
    reportedBy = reportedBy.toString();
  }

  return {
    id,
    _id: obj._id,
    title: obj.title,
    description: obj.description,
    category: obj.category,
    status: obj.status,
    location: obj.location,
    reportedBy,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

// GET /api/items
// Section 3 & Stretch Goal 4 (Query filtering) & Stretch Goal 5 (Populate)
export async function getAllItems(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.location) {
      filter.location = req.query.location;
    }

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: items.map(publicItem) });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// Section 3 & Stretch Goal 5 (Populate)
export async function getItem(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(item) });
  } catch (err) { next(err); }
}

// POST /api/items
// Section 2 & Section 3
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    if (value.reportedBy === '' || value.reportedBy === null) {
      delete value.reportedBy;
    }

    const item = await Item.create(value);
    if (item.reportedBy) {
      await item.populate('reportedBy', 'name email');
    }
    res.status(201).json({ item: publicItem(item) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title already exists at this location' });
    }
    next(err);
  }
}

// PATCH /api/items/:id (or PUT)
// Section 2 & Section 3
export async function updateItem(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    if (value.reportedBy === '' || value.reportedBy === null) {
      value.reportedBy = null;
    }

    const doc = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');

    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(doc) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title already exists at this location' });
    }
    next(err);
  }
}

// DELETE /api/items/:id
// Section 3
export async function deleteItem(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

