const bcrypt = require("bcryptjs");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const generateRandomString = require("../utils/randomStr");

module.exports = function(Model, configSettings, callbackUri) {
    return new GoogleStrategy({
            clientID: configSettings.clientID,
            clientSecret: configSettings.clientSecret,
            callbackURL: callbackUri,
        },
        async(request, accessToken, refreshToken, profile, done) => {
            const modelRes = await Model.findOne({
                googleId: profile.id,
                provider: "google",
            });

            if (modelRes) {
                // console.log("login teacher from passportjs");

                done(null, modelRes);
            } else {
                // create this Teacher
                try {
                    let password = generateRandomString(10);
                    const salt = await bcrypt.genSalt(10);
                    password = await bcrypt.hash(password, salt);
                    const modelRes = new Model({
                        password,
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        photo: profile.photos[0].value,
                        provider: "google",
                    });
                    await modelRes.save();
                    done(null, modelRes);
                } catch (error) {
                    console.log(error.message);
                }
            }
        }
    );
};