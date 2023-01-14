const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Notification", notificationSchema);