import Joi from 'joi';
import { Item } from '../models/Item.js';


const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().allow('').default(''),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').default('other'),
  status: Joi.string().valid('lost', 'found', 'claimed').default('lost'),
  location: Joi.string().trim().allow('').default(''),
  reportedBy: Joi.string().hex().length(24).allow(null).optional()
});

const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().allow(''),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().trim().allow(''),
  reportedBy: Joi.alternatives().try(Joi.string().hex().length(24), Joi.valid(null))
}).min(1).unknown(false);

function publicItem(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description ?? '',
    category: item.category,
    status: item.status,
    location: item.location ?? '',
    reportedBy: item.reportedBy
      ? (typeof item.reportedBy === 'object'
          ? {
              id: item.reportedBy._id.toString(),
              name: item.reportedBy.name,
              email: item.reportedBy.email
            }
          : item.reportedBy.toString())
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;

    const items = await Item.find(filters)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: items.map(publicItem) });
  } catch (err) { next(err); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(item) });
  } catch (err) { next(err); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    const populated = await Item.findById(item._id).populate('reportedBy', 'name email');
    res.status(201).json({ item: publicItem(populated) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'At least one valid field is required for update' });
    }

    const allowedKeys = ['title', 'description', 'category', 'status', 'location', 'reportedBy'];
    const unknownKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
    if (unknownKeys.length > 0) {
      return res.status(400).json({ message: `Unknown field(s): ${unknownKeys.join(', ')}` });
    }

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, allowUnknown: false });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });

    const updated = await Item.findById(doc._id).populate('reportedBy', 'name email');
    res.json({ item: publicItem(updated) });
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
