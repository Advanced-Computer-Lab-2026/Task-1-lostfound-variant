import { Router } from 'express';
import {
  getAllItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';

const router = Router();

router.route('/').get(getAllItems);
  
router.route('/').post(createItem);

router.route('/:id').delete(deleteItem);
router.route('/:id').patch(updateItem);
router.route('/:id').get(getItem);
export default router;
