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
async function submittedScoreNotification(studentId, assignmentId) {
    const notification = new Notification({
        title: "Submit Assignment",
        message: `You  submitted your lab assignment`,
        type: NOTIFICATION_TYPES.submittedPractical,
        recipient: studentId,
        entity: assignmentId,
    });
    return notification.save();
}

async function createTopicalMcqNotification(studentId, assignmentId) {
    const notification = new Notification({
        title: "New Topical MCQ Assignment",
        message: `You have a new Topical MCQ assignment`,
        type: NOTIFICATION_TYPES.topicalMCQ,
        recipient: studentId,
        entity: assignmentId,
    });
    return notification.save();
}

module.exports = {
    createAssignedLabNotification,
    submittedScoreNotification,
    createTopicalMcqNotification
};