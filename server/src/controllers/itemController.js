import { Item } from '../models/Item.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(200),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').default('other'),
  status: Joi.string().valid('lost', 'found', 'claimed').default('lost'),
  location: Joi.string().max(100),
  reportedBy: Joi.string().hex().length(24).required()
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string().max(200),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().max(100),
  reportedBy: Joi.string().hex().length(24)
});

const filterSchema = Joi.object({
  status: Joi.string().valid("lost", "found", "claimed"),

  category: Joi.string().valid(
    "electronics",
    "clothing",
    "documents",
    "accessories",
    "other",
  ),
});

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const { value, error } = filterSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const filter = {};

    if (value.status) {
      filter.status = value.status;
    }

    if (value.category) {
      filter.category = value.category;
    }

    const items = await Item.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
      const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json({ item: item });
    } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
      const { value, error } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.message });
  
      const existing = await Item.findOne({ title: value.title, location: value.location });
      if (existing) return res.status(409).json({ message: 'Item already reported at this location' });
  
      const item = await Item.create(value);
      res.status(201).json({ item: item });
    } catch (err) { next(err); }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
      const { value, error } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.message });

      const item = await Item.findByIdAndUpdate(req.params.id, value, { new: true });
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json({ item: item });
    } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
      const item = await Item.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json({ message: 'Item deleted' });
    } catch (err) { next(err); }
}
