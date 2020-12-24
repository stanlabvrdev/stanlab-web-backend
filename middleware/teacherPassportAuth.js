const { teacherPassport } = require("../services/initPassport");
module.exports = function(req, res, next) {
    return teacherPassport.authenticate(
        "google", {
            session: false,
        },
        (err, user, info) => {
            if (user) {
                const token = user.generateAuthToken();
                res.send(token);
            } else return res.status(401).send(info);
        }
    )(req, res, next);
};