const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  selectedSchool: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  isActive: { type: Boolean },
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = { Profile };
