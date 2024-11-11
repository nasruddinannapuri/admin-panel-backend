const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  f_Id: Number,
  f_Image: String,
  f_Name: { type: String, required: true },
  f_Email: { type: String, required: true, unique: true },
  f_Mobile: String,
  f_Designation: String,
  f_Gender: String,
  f_Course: [String],
  f_Createdate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }  
});

module.exports = mongoose.model('Employee', employeeSchema);