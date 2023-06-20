const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = {
  async up(db) {
    await db.collection("generatedquestions").updateMany({ type: { $exists: false } }, { $set: { type: "MCQ" } });
  },

  async down(db) {
    await db.collection("generatedquestions").updateMany({ type: "MCQ" }, { $unset: { type: 1 } });
  },
};
