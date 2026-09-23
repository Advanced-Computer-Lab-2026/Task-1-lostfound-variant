import mongoose from 'mongoose';
import Joi from 'joi';
import { Item } from '../models/Item.js';
// Validation schema for creating/updating an item
const itemSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().allow(''),
  reportedBy: Joi.string()
});

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const filter = {};

    // Only filter when query parameters are provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findById(id)
      .populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (err) {
    next(err);
  }
}
// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = itemSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    const item = await Item.create(value);

    const populatedItem = await item.populate('reportedBy', 'name email');

    res.status(201).json({
      item: populatedItem
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = itemSchema
      .fork(['title'], (schema) => schema.optional())
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      {
        new: true,
        runValidators: true
      }
    ).populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}