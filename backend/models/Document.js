import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  type: {type: String, required: true},
  parentId: {type: String, required: false},
  content: { type: String, required: false},
  order: {type: Number, required: true}
}, {
  timestamps: true
});

export const Document = mongoose.model('Document', noteSchema);
