import { Item } from '../models/Item.js';
import Joi from 'joi';


// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').default('other').optional(),
  status: Joi.string().valid('lost', 'found', 'claimed').default('lost').optional(),
  location: Joi.string().optional(),
  reportedBy: Joi.string().hex().length(24).optional()
});

const updateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').default('other').optional(),
  status: Joi.string().valid('lost', 'found', 'claimed').default('lost').optional(),
  location: Joi.string().optional(),
  reportedBy: Joi.string().hex().length(24).optional()
});

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    // TODO
      const filter = {};

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.category) {
      filter.category = req.query.category.toLowerCase();
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
    // TODO
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    // TODO
    const { value, error } = createSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message });
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
    // TODO
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
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    // TODO
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
}
