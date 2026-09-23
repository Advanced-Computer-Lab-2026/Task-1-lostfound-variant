import { Item } from '../models/Item.js';
import Joi from 'joi';
// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string(),
  category: Joi.string().valid(
    "electronics", "clothing", "documents","accessories","other").default("other"),
  status:Joi.string().valid("claimed","found","lost").default("lost"),
   location: Joi.string(),
  reportedBy: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string(),
  category: Joi.string().valid(
    "electronics", "clothing", "documents","accessories","other").default("other"),
  status:Joi.string().valid("claimed","found","lost").default("lost"),
   location: Joi.string(),
  reportedBy: Joi.string().hex().length(24)
});

function publicItem(i) {
  return { id: i._id.toString(), title: i.title, description:i.description,category:i.category,status:i.status,
    location:i.location,reportedBy:i.reportedBy, createdAt: i.createdAt };
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

    const items = await Item.find(filter)
  .populate('reportedBy', 'name email')
  .sort({ createdAt: -1 });
    res.json({
      items: items.map(publicItem)
    });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id)
  .populate('reportedBy', 'name email');
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });
        const item = await Item.create(value);
        res.status(201).json(publicItem(item));
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
   
       const item = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
       if (!item) return res.status(404).json({ message: 'Item not found' });
       res.json(item);
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ ok: true });
  } catch (err) { next(err); }
}
