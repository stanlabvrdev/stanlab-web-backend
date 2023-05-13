import mongoose from "mongoose";
export interface ProfileAttr {
  _id: string;
  teacher: string | null;
  student: string | null;
  selectedSchool: string | null;
  isActive: boolean;
}

const profileSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  selectedSchool: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  isActive: { type: Boolean, default: true },
});

const Profile = mongoose.model("Profile", profileSchema);

export { Profile };
