import Joi from 'joi';
import { Item } from '../models/Item.js';
const createSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),

  description: Joi.string().allow(''),

  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),

  status: Joi.string().valid(
    'lost',
    'found',
    'claimed'
  ),

  location: Joi.string().allow(''),

  reportedBy: Joi.string()
});
const updateSchema = Joi.object({
  title: Joi.string().min(1).max(200),

  description: Joi.string().allow(''),

  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),

  status: Joi.string().valid(
    'lost',
    'found',
    'claimed'
  ),

  location: Joi.string().allow(''),

  reportedBy: Joi.string()
}).min(1);

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
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email')
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
}
// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email');

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

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { error, value } = createSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((detail) => detail.message)
      });
    }

    const item = await Item.create(value);

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { error, value } = updateSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((detail) => detail.message)
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      value,
      {
        new: true,
        runValidators: true
      }
    );

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
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    res.json({
      message: 'Item deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}