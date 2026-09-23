import { Router } from 'express';

import {
  getAllItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';

const router = Router();

// GET /api/items
router.get('/', getAllItems);

// GET /api/items/:id
router.get('/:id', getItem);

// POST /api/items
router.post('/', createItem);

// PATCH /api/items/:id
router.patch('/:id', updateItem);

// DELETE /api/items/:id
router.delete('/:id', deleteItem);

export default router;