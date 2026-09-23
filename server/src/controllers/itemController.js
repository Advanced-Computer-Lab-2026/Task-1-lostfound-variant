import { Item } from '../models/Item.js';
import Joi from 'joi';

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string(),
  reportedBy: Joi.string(),
});

const updateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string(),
  reportedBy: Joi.string(),
});

function publicItem(i) {
  return { id: i._id.toString(), 
    title: i.title, 
    description: i.description, 
    category: i.category, 
    status: i.status,
    location: i.location,
    reportedBy: i.reportedBy? {
      id: i.reportedBy._id.toString(),
      name: i.reportedBy.name,
      email: i.reportedBy.email
    }: null,
    createdAt: i.createdAt };
}

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
    const items = await Item.find(filter).populate('reportedBy', 'name email').sort({ createdAt: -1 }).lean();
    res.json({ items: items.map(publicItem) });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
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
    if (existing) return res.status(409).json({ message: 'Title already used' });

    const item = await Item.create({
      title: value.title, 
      description: value.description, 
      category: value.category, 
      status: value.status,
      location: value.location,
      reportedBy: value.reportedBy,});
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
