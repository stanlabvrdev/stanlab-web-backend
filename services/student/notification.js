const NOTIFICATION_TYPES = require("../../constants/notification-types");
const Notification = require("../../models/notification");

async function createAssignedLabNotification(studentId, assignmentId, teacherName) {
    const notification = new Notification({
        title: "New Assignment",
        message: `You have been assigned a new lab assignment by ${teacherName}`,
        type: NOTIFICATION_TYPES.assignedPractical,
        recipient: studentId,
        entity: assignmentId,
    });
    return notification.save();
}

module.exports = {
    createAssignedLabNotification,
};