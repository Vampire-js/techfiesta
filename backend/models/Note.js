const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  folderId: {type: String, required:true},
  name: {type:String, required:true},
  content: {type:String, required:false}
}, {
  timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
