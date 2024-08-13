const BigPromise = require("../middlewares/BigPromise");
const User = require("../models/userModel");
const CustomError = require("../utils/customError");
const { _getCookieToken } = require("../utils/user.utils");

exports.signUp = BigPromise(async (req, res, next) => {
    const { username, emailId, phoneNumber, companyName, password, customerPlan } = req.body;

    if (!username || !emailId || !phoneNumber || !companyName || !password) {
        res.status(401).json({
            message: "Fields are missing, Bad Request!"
        })
    }
    let user;
    try {
        user = await User.create({
            username, phoneNumber, companyName, emailId, password, customerPlan: "Free"
        })

    } catch (err) {
        throw err;
    }

    _getCookieToken(user, res);
})


exports.signIn = BigPromise(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new CustomError("Please Provide Email and Password", 400));
    }

    const user = await User.findOne({ emailId: email }).select("+password")
    if (!user) {
        return next(new CustomError("User Does not exist Please Sign Up", 400));
    }

    const isPasswordCorrect = await user.isPasswordValid(password);

    if (!isPasswordCorrect) {
        return next(new CustomError("Enter Correct Password", 400));
    }

    _getCookieToken(user, res);
});