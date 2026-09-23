import Joi from 'joi';
import { Item } from '../models/Item.js';

const createSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow(''),
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
  location: Joi.string().trim().allow(''),
  reportedBy: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim().allow(''),
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
  location: Joi.string().trim().allow(''),
  reportedBy: Joi.string().hex().length(24)
}).min(1);
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
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items });

  } catch (err) { next(err); }

}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {

    const item = await Item.findById(req.params.id)
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
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const item = await Item.create(value);

    const populatedItem = await Item.findById(item._id)
      .populate('reportedBy', 'name email');

    res.status(201).json({ item: populatedItem });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An item with the same title at the same location already exists'
      });
    }

    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
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
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An item with the same title at the same location already exists'
      });
    }

    next(err);
  }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ ok: true });

  } catch (err) {
    next(err);
  }
}
