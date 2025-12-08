const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: {type:String, required:true}
}, {
  timestamps: true
});

module.exports = mongoose.model('Folder', folderSchema);
