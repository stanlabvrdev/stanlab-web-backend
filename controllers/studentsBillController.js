const envConfig = require("../config/env");

const env = envConfig.getAll();

const stripe = require("stripe")(env.stripe_Secret_Key);

const { Student } = require("../models/student");

async function postCharge(req, res) {
    try {
        await stripe.charges.create({
            amount: 500,
            currency: "usd",
            description: "$5 for Basic plan",
            sources: req.body.id,
        });

        let student = await Student.findOne({ _id: req.student._id }).select("-password -avatar");

        student.plan.charges += 5;
        student.plan.name = "Basic";
        student.plan.description = "payment made for a teachers";
        student = await student.save();
        res.send(student);
    } catch (error) {
        res.send({ message: "Something went wrong" });
        console.log(error.message);
    }
}

module.exports = {
    postCharge,
};