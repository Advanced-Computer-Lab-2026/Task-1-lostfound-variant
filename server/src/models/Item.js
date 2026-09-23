import mongoose from 'mongoose';
import { User } from './User';

// TODO: define the Item schema per README.md section 1.

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String,},
    category: { type: String, enum: [electronics,clothing,documents,accessories,other], default: other , required: true },
    status: { type: String,enum: [lost, found,claimed, lost], default: lost},
    location: { type: String, required: true, unique: true, lowercase: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // TODO
  },
  { timestamps: true }
);

// TODO: add the uniqueness constraint described in README.md section 1.

itemSchema.index({ title: 1, location: 1 }, { unique: true });
export const Item = mongoose.model('Item', itemSchema);
