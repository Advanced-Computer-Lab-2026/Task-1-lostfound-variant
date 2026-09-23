import mongoose from 'mongoose';
import Joi from 'joi';
import { Item } from '../models/Item.js';


// Validation schema for creating an item
const createItemSchema = Joi.object({
    title: Joi.string().required(),

    description: Joi.string().optional(),

    category: Joi.string()
        .valid(
            'electronics',
            'clothing',
            'documents',
            'accessories',
            'other'
        )
        .optional(),

    status: Joi.string()
        .valid('lost', 'found', 'claimed')
        .optional(),

    location: Joi.string().optional(),

    reportedBy: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.message('reportedBy must be a valid User ID');
            }

            return value;
        })
        .optional()
});


// Validation schema for updating an item
// All fields are optional because PATCH allows partial updates
const updateItemSchema = Joi.object({
    title: Joi.string().optional(),

    description: Joi.string().optional(),

    category: Joi.string()
        .valid(
            'electronics',
            'clothing',
            'documents',
            'accessories',
            'other'
        )
        .optional(),

    status: Joi.string()
        .valid('lost', 'found', 'claimed')
        .optional(),

    location: Joi.string().optional(),

    reportedBy: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.message('reportedBy must be a valid User ID');
            }

            return value;
        })
        .optional()
}).min(1);


// GET /api/items
export async function getAllItems(req, res, next) {
    try {
        const filter = {};

        // Stretch goal: filtering
        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        const items = await Item.find(filter)
            .populate('reportedBy', 'name email');

        res.status(200).json(items);
    } catch (err) {
        next(err);
    }
}


// GET /api/items/:id
export async function getItem(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid item ID'
            });
        }

        const item = await Item.findById(id)
            .populate('reportedBy', 'name email');

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        res.status(200).json(item);
    } catch (err) {
        next(err);
    }
}


// POST /api/items
export async function createItem(req, res, next) {
    try {
        const { error, value } = createItemSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const item = await Item.create(value);

        res.status(201).json(item);
    } catch (err) {
        // Duplicate { title, location }
        if (err.code === 11000) {
            return res.status(409).json({
                message: 'An item with the same title and location already exists'
            });
        }

        next(err);
    }
}


// PATCH /api/items/:id
export async function updateItem(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid item ID'
            });
        }

        const { error, value } = updateItemSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const item = await Item.findByIdAndUpdate(
            id,
            value,
            {
                new: true,
                runValidators: true
            }
        );

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        res.status(200).json(item);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                message: 'An item with the same title and location already exists'
            });
        }

        next(err);
    }
}


// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid item ID'
            });
        }

        const item = await Item.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        res.status(200).json({
            message: 'Item deleted successfully'
        });
    } catch (err) {
        next(err);
    }
  }