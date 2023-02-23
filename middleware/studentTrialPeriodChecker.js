const { Student } = require("../models/student");
const constants = require("../utils/constants");
const moment = require("moment");
const { ServerErrorHandler } = require("../services/response/serverResponse");

module.exports = async function(req, res, next) {
    try {
        const student = await Student.findOne({ _id: req.student._id });
        const expired = moment(student[constants.trialPeriod.title]).diff(moment(), "s");

        if (expired <= 0) return res.status(403).send({ message: "You trial period is over" });
        else return next();
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
};