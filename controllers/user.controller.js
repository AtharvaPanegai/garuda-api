const BigPromise = require("../middlewares/BigPromise");
const User = require("../models/user.model");
const CustomError = require("../utils/customError");
const logger = require("logat");
const { _getCookieToken, _getUserUsingId, _updateUserInfoUsingGivenData, _createUser, _deleteUser, _getUsernamesInProject } = require("../utils/user.utils");
const { _getProjectsUsingCustomerId } = require("../utils/project.utils");

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

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout Success",
  });
});


exports.handleMultipleMethods = BigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.method === 'GET') {
            const userId = req.params.id;
            const user = await _getUserUsingId(userId);
            res.status(200).json({ success: true, user });
        } else if (req.method === 'PUT') {
            const userId = req.params.id;
            const updatedUser = await _updateUserInfoUsingGivenData(userId, req.body);
            res.status(200).json({ success: true, updatedUser });
        } else if (req.method === 'POST') {
            const newUser = await _createUser(req.body);
            res.status(201).json({ success: true, newUser });
        } else if (req.method === 'DELETE') {
            const userId = req.params.id;
            await _deleteUser(userId);
            res.status(204).json({ success: true, message: 'User deleted successfully' });
        } else {
            res.status(405).json({ success: false, message: 'Method Not Allowed' });
        }
    } catch (error) {
        next(error);
    }
});


exports.handleUniqueUsernames = BigPromise(async (req, res, next) => {
    const { usernameInput } = req.body;

    if (!usernameInput) {
        logger.error(`Error || Username input is missing please provde the mandatory fields!`);
        throw new CustomError(`Please Provide the username input as mandatory field!`, 422);
    }

    let existingUsernames = await _getUsernamesInProject();
    const isTaken = existingUsernames.includes(usernameInput);

    if(isTaken){
        logger.info(`INFO || Given usernameInput : ${usernameInput} already existing returning`);
        return res.status(409).json({
            success: false,
            message: 'Username is already taken. Please choose another one.'
        });
    }
    
    logger.info(`INFO || Given usernameInput : ${usernameInput} is available`);
    return res.status(200).json({
        success: true,
        message: `Given Username : ${usernameInput} is available`
    });


})


exports.getAllProjectsUnderCustomer = BigPromise(async (req, res, next) => {
    const { customerId } = req.body;

    let projects = await _getProjectsUsingCustomerId(customerId);

    res.status(200).json({
        message : `Total Projects are ${projects.length}`,
        projects
    })
})