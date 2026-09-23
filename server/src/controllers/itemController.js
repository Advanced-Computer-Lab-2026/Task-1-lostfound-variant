import { Item } from '../models/Item.js';
import { User } from '../models/User.js';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().enum(["electronics", "clothing", "documents", "accessories", "other"]),
  status: Joi.string().enum(["lost", "found", "claimed"]),
  location: Joi.string().email().optional(),
  reportedBy: Joi.ref(User).optional()
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string().enum(["electronics", "clothing", "documents", "accessories", "other"]),
  status: Joi.string().enum(["lost", "found", "claimed"]),
  location: Joi.string().email(),
  reportedBy: Joi.ref(User)
});

function publicItems(i) {
  return { title: i.title, description: i.description, category: i.category, status: i.status, location: i.location, reportedBy: i.reportedBy};
}


// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
      const { status, category } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    const items = await Item.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id)
      .populate("reportedBy", "name email")
      .lean();

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ item: publicItems(item) });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });
    
        const existing = await Item.findOne({  title: req.body.title, location: req.body.location});
        if (existing) return res.status(409).json({ message: 'Item with this title already exists at this location' });
        
        const item = await Item.create({ title: value.title, description: value.description, category: value.category, status : value.status, reportedBy: value.reportedBy });
        res.status(201).json({ item: publicItems(item) });
  } catch (err) {next(err);}
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) return res.status(400).json({ message: error.message });
    
        const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ message: 'Item not found' });
        res.json({ item: publicItems(doc) });
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
