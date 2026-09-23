import Joi from 'joi';
import mongoose from 'mongoose';
import { Item, ITEM_CATEGORIES, ITEM_STATUSES } from '../models/Item.js';
import { User } from '../models/User.js';

const objectId = Joi.string().hex().length(24);

const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().max(1000).allow(''),
  category: Joi.string().valid(...ITEM_CATEGORIES),
  status: Joi.string().valid(...ITEM_STATUSES),
  location: Joi.string().trim().max(120).allow(''),
  reportedBy: objectId
});

const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120),
  description: Joi.string().trim().max(1000).allow(''),
  category: Joi.string().valid(...ITEM_CATEGORIES),
  status: Joi.string().valid(...ITEM_STATUSES),
  location: Joi.string().trim().max(120).allow(''),
  reportedBy: objectId.allow(null)
}).min(1);

const filterSchema = Joi.object({
  status: Joi.string().valid(...ITEM_STATUSES),
  category: Joi.string().valid(...ITEM_CATEGORIES)
});

const REPORTER_FIELDS = 'name email';

function isDuplicateKey(err) {
  return err && err.code === 11000;
}

// GET /api/items?status=lost&category=electronics
export async function getAllItems(req, res, next) {
  try {
    const { value: filter, error } = filterSchema.validate(req.query, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const items = await Item.find(filter)
      .populate('reportedBy', REPORTER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (err) { next(err); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(req.params.id).populate('reportedBy', REPORTER_FIELDS);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    if (value.reportedBy && !(await User.exists({ _id: value.reportedBy }))) {
      return res.status(400).json({ message: 'reportedBy user does not exist' });
    }

    const item = await Item.create(value);
    res.status(201).json({ item });
  } catch (err) {
    if (isDuplicateKey(err)) {
      return res.status(409).json({ message: 'An item with this title was already reported at this location' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    if (value.reportedBy && !(await User.exists({ _id: value.reportedBy }))) {
      return res.status(400).json({ message: 'reportedBy user does not exist' });
    }

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: doc });
  } catch (err) {
    if (isDuplicateKey(err)) {
      return res.status(409).json({ message: 'An item with this title was already reported at this location' });
    }
    next(err);
  }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
