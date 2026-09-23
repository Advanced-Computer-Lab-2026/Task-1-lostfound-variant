import { Item } from '../models/Item.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2. DONE!!
const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(200).optional(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').default('other'),
  status: Joi.string().valid('lost', 'found', 'claimed').default('lost'),
  location: Joi.string().max(100).optional(),
  reportedBy: Joi.string().hex().length(24).optional()
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string().max(200),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').default('other'),
  status: Joi.string().valid('lost', 'found', 'claimed').default('lost'),
  location: Joi.string().max(100),
  reportedBy: Joi.string().hex().length(24)
});

const filterSchema = Joi.object({
  status: Joi.string().valid('lost', 'found', 'claimed'),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other')
});

function publicItem(item) {
  const obj = typeof item.toObject === 'function' ? item.toObject() : item;
  const { __v, ...rest } = obj;
  return rest;
}

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

     const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email') // only pull name + email, not the full user doc
      .lean();

    const item = await Item.find(filter).sort({ createdAt: -1 }).lean();
       res.json({ item: item.map(publicItem) });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email');
      
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ item: publicItem(item) });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });
    
        const existing = await Item.findOne({ title: value.title });
        if (existing) return res.status(409).json({ message: 'Item already exists' });
    
        const item = await Item.create({ title: value.title, description: value.description, category: value.category, status: value.status, location: value.location, reportedBy: value.reportedBy });
        res.status(201).json({ item: publicItem(item) });
  } catch (err) {
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
        res.json({ item: publicItem(doc) });
  } catch (err) { next(err); }
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
