import mongoose from 'mongoose';

export const ITEM_CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
export const ITEM_STATUSES = ['lost', 'found', 'claimed'];

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: ITEM_CATEGORIES, default: 'other' },
    status: { type: String, enum: ITEM_STATUSES, default: 'lost' },
    location: { type: String, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Same title can't be reported twice at the same location.
itemSchema.index({ title: 1, location: 1 }, { unique: true });

export const Item = mongoose.model('Item', itemSchema);
