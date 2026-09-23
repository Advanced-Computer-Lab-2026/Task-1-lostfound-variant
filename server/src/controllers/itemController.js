import Joi from 'joi';
import { Item } from '../models/Item.js';

// Validation schema for creating an item
const createItemSchema = Joi.object({
  title: Joi.string().required(),

  description: Joi.string().optional(),

  category: Joi.string()
    .valid('electronics', 'clothing', 'documents', 'accessories', 'other')
    .default('other'),

  status: Joi.string()
    .valid('lost', 'found', 'claimed')
    .default('lost'),

  location: Joi.string().optional(),

  reportedBy: Joi.string()
    .hex()
    .length(24)
    .optional(),
});

// Validation schema for updating an item
const updateItemSchema = Joi.object({
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
    .hex()
    .length(24),
}).min(1);


// GET /api/items
// GET /api/items (Read All)
export const getAllItems = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    // .populate() replaces the User ObjectId with the actual User document fields
    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

// GET /api/items/:id (Read One)
export const getItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }

    const item = await Item.findById(id).populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { error, value } = createItemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const item = await Item.create(value);

    res.status(201).json(item);
  } catch (err) {
    // Duplicate title + location
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An item with this title already exists at this location',
      });
    }

    next(err);
  }
}


// PUT /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { error, value } = updateItemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      value,
      {
        new: true,
        runValidators: true,
      }
    ).populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({
        message: 'Item not found',
      });
    }

    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An item with this title already exists at this location',
      });
    }

    next(err);
  }
}


// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: 'Item not found',
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}