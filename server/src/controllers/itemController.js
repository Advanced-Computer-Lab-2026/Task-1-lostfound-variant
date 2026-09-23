import { Item } from '../models/Item.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(500),
  category: Joi.string().valid('Electronics', 'Clothing', 'Documents', 'Accesories', 'Other').default('Other'),
  status: Joi.string().valid('Lost', 'Found', 'Claimed').default('Lost'),
  location: Joi.string().max(100),
  reportedBy: Joi.string().hex().length(24)
})

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string().max(500),
  category: Joi.string().valid('Electronics', 'Clothing', 'Documents', 'Accesories', 'Other'),
  status: Joi.string().valid('Lost', 'Found', 'Claimed'),
  location: Joi.string().max(100),
  reportedBy: Joi.string().hex().length(24)
})

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    const items = await Item.find(filters).sort({ createdAt: -1 }).populate('reportedBy', 'name email').lean();
    res.json({ items }); 
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    // TODO
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email').lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    // TODO
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Item.findOne({ title: value.title, location: value.location });
    if (existing) return res.status(409).json({ message: 'Item with the same title and location already exists' });

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
    const {value, error} = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: doc });
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    // TODO
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
