import Joi from 'joi';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

const categories = [
  'electronics',
  'clothing',
  'documents',
  'accessories',
  'other'
];

const statuses = [
  'lost',
  'found',
  'claimed'
];

// Validation for creating an item
const createSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required(),

  description: Joi.string()
    .max(2000)
    .allow(''),

  category: Joi.string()
    .valid(...categories),

  status: Joi.string()
    .valid(...statuses),

  location: Joi.string()
    .max(200)
    .allow(''),

  reportedBy: Joi.string()
    .hex()
    .length(24)
});

// Validation for updating an item
const updateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200),

  description: Joi.string()
    .max(2000)
    .allow(''),

  category: Joi.string()
    .valid(...categories),

  status: Joi.string()
    .valid(...statuses),

  location: Joi.string()
    .max(200)
    .allow(''),

  reportedBy: Joi.string()
    .hex()
    .length(24)
}).min(1);


// --------------------------------------------------
// GET /api/items
// Get all items
// --------------------------------------------------
export async function getAllItems(req, res, next) {
  try {
    const filter = {};

    // Optional filtering by status
    if (req.query.status !== undefined) {
      if (!statuses.includes(req.query.status)) {
        return res.status(400).json({
          message: 'Invalid status'
        });
      }

      filter.status = req.query.status;
    }

    // Optional filtering by category
    if (req.query.category !== undefined) {
      if (!categories.includes(req.query.category)) {
        return res.status(400).json({
          message: 'Invalid category'
        });
      }

      filter.category = req.query.category;
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email');

    res.json({
      items
    });
  } catch (err) {
    next(err);
  }
}


// --------------------------------------------------
// GET /api/items/:id
// Get one item
// --------------------------------------------------
export async function getItem(req, res, next) {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid item id'
      });
    }

    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    res.json({
      item
    });
  } catch (err) {
    next(err);
  }
}


// --------------------------------------------------
// POST /api/items
// Create an item
// --------------------------------------------------
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    const item = await Item.create(value);

    res.status(201).json({
      item
    });
  } catch (err) {
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          'An item with the same title and location already exists'
      });
    }

    next(err);
  }
}


// --------------------------------------------------
// PATCH /api/items/:id
// Update an item
// --------------------------------------------------
export async function updateItem(req, res, next) {
  try {
    // Check if the ID is valid
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid item id'
      });
    }

    const { value, error } = updateSchema.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        $set: value
      },
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

    res.json({
      item
    });
  } catch (err) {
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          'An item with the same title and location already exists'
      });
    }

    next(err);
  }
}


// --------------------------------------------------
// DELETE /api/items/:id
// Delete an item
// --------------------------------------------------
export async function deleteItem(req, res, next) {
  try {
    // Check if the ID is valid
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid item id'
      });
    }

    const item = await Item.findByIdAndDelete(
      req.params.id
    );

    if (!item) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    res.json({
      ok: true
    });
  } catch (err) {
    next(err);
  }
}