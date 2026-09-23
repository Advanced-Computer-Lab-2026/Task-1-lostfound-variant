import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true},
    description: {type: String, default: ''},
    category: {type: String, enum: ['electronics', 'clothing', 'documents', 'accessories', 'other'], default: 'other'},
    status: {type: String, enum: ['lost', 'found', 'claimed'], default: 'lost'},
    location: {type: String, default: ''},
    reportedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
  },
  {timestamps: true}
);

itemSchema.index({ title: 1, location: 1 }, { unique: true });

export const Item = mongoose.model('Item', itemSchema);