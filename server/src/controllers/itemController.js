import Joi from 'joi';
import { Item } from '../models/Item.js';

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string()
    .valid('electronics', 'clothing', 'documents', 'accessories', 'other')
    .optional(),
  status: Joi.string()
    .valid('lost', 'found', 'claimed')
    .optional(),
  location: Joi.string().optional(),
  reportedBy: Joi.string().optional()
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string()
    .valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string()
    .valid('lost', 'found', 'claimed'),
  location: Joi.string(),
  reportedBy: Joi.string()
});

// GET /api/items
// TODO: implement per README.md section 3.
// GET /api/items
// GET /api/items
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
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email');

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
// GET /api/items/:id
// GET /api/items/:id
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
// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) {return res.status(400).json({ message: error.message });}
    const item = await Item.create(value);

    res.status(201).json({ item });
  } catch (err) {next(err);}
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {abortEarly: false,stripUnknown: true});

    if (error) { return res.status(400).json({ message: error.message });}

    const doc = await Item.findByIdAndUpdate(req.params.id,{ $set: value },{ new: true, runValidators: true }
    );

    if (!doc) {return res.status(404).json({ message: 'Item not found' });}
    res.json({ item: doc });
  } catch (err) {next(err);}
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);

    if (!doc) {return res.status(404).json({ message: 'Item not found' });}
    res.json({ ok: true });
  } catch (err) { next(err)}
}
