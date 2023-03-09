const { LabExperiment } = require("../../models/labAssignment");
const { TeacherClass } = require("../../models/teacherClass");
const NotFoundError = require("../exceptions/not-found");

class StudentLabExperimentService {
    async getAll(req) {
        const { is_completed } = req.query;
        const conditions = { student: req.student._id };

        if (is_completed) {
            conditions.isCompleted = is_completed == "true" ? true : false;
        }

        return LabExperiment.find(conditions)
            .populate({ path: "experiment", select: ["name", "_id", "subject", "icon"] })
            .populate({ path: "classId", select: ["title", "subject", "section", "_id"], alias: "class" })
            .populate({
                path: "teacher",
                select: ["name", "email", "_id"],
            });
    }
}

const studentLabExperimentService = new StudentLabExperimentService();
module.exports = studentLabExperimentService;