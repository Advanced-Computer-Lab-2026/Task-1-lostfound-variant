import Joi from 'joi';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

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
// TODO: write a validation schema for create/update per README.md section 2.

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
  .populate('reportedBy', '-password');

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}
// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

   const item = await Item.findById(req.params.id)
  .populate('reportedBy', '-password');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}
// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { error, value } = itemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const updateSchema = Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      category: Joi.string().valid(
        'electronics',
        'clothing',
        'documents',
        'accessories',
        'other'
      ),
      status: Joi.string().valid('lost', 'found', 'claimed'),
      location: Joi.string(),
      reportedBy: Joi.string()
    });

    const { error, value } = updateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    ).populate('reportedBy');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({
      message: 'Item deleted successfully',
      item
    });
  } catch (err) {
    next(err);
  }
}
