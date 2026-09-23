import { Router } from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';

const router = Router();


router.get('/',getAllItems);
router.post('/',createItem);


router.get('/:id',getItemById);
router.patch('/:id',updateItem);
router.delete('/:id',deleteItem);


export default router;
