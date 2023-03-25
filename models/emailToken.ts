import mongoose from "mongoose";

const emailTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiredAt: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
});

const EmailToken = mongoose.model("EmailToken", emailTokenSchema);

export { EmailToken };
