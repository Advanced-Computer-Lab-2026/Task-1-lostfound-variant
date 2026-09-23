import Joi from 'joi';
import { Item } from '../models/Item.js';

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
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
  title: Joi.string(),
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

function publicItem(i) {
  return { 
    id: valid._id.toString(), 
    title: valid.title,
    description: valid.description,
    category: valid.category,
    status: valid.status,
    location: valid.location,
    reportedBy: valid.reportedBy
      ? {
          name: valid.reportedBy.name,
          email: valid.reportedBy.email
        }
      : null,
    createdAt: valid.createdAt };
}

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }
    const items = await Item.find().populate('reportedBy', 'name email').sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');

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
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    const item = await Item.create(value);

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
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