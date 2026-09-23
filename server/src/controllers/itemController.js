import { Item } from '../models/Item.js';
import Joi from 'joi';
// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().max(1000).allow('', null),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().trim().max(200).allow('', null),
  reportedBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
});
const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120),
  description: Joi.string().max(1000).allow('', null),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().trim().max(200).allow('', null),
  reportedBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
}).min(1);


// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const items = await Item.find(filter).sort({ createdAt: -1 }).populate('reportedBy', 'name email').lean();
    res.json({ items });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email').lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    res.status(201).json({ item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That item (same title + location) has already been reported' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
   const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: doc });
  } catch (err) {if (err.code === 11000) {
      return res.status(409).json({ message: 'That item (same title + location) has already been reported' });
    } next(err); 
  }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
   const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
