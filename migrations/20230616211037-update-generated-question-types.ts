const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = {
  async up(db, client) {
    await db.collection("generatedquestions").updateMany({ type: { $exists: false } }, { $set: { type: "MCQ" } });
  },

  async down(db, client) {
    await db.collection("generatedquestions").updateMany({ type: "MCQ" }, { $unset: { type: 1 } });
  },
};
