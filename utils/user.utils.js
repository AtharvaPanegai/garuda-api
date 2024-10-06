const logger = require("logat");
const User = require("../models/user.model")

const _doesThisCustomerExists = async (userId) => {
    let customer = await User.findById(userId);
    if (customer) {
        return true;
    }
    return false;
}

const _getCookieToken = (user, res) => {
    const token = user.getJwtToken();
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    user.password = undefined;
    res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user,
    });
};


const _getUserUsingId = async (id) => {
    return User.findById(id);
};

const _updateUserInfoUsingGivenData = async (id, data) => {
    return User.findByIdAndUpdate(id, data, { new: true });
};

const _createUser = async (data) => {
    return User.create(data);
};

const _deleteUser = async (id) => {
    return User.findByIdAndDelete(id);
};

const _saveProjectInUser = async (userId, projectId) => {
    await User.findByIdAndUpdate(
        userId,
        { $push: { projects: projectId } },
        { new: true, useFindAndModify: false }
    );
}


const _getUsernamesInProject = async () => {
    try {
        let res = await User.find({}, { "username": 1, "_id": 0 });
        let usernames = [];
        for (let user of res) {
            usernames.push(user.username);
        }
        return usernames;
    } catch (err) {
        logger.error(`Error || Error in getting all usernames`);
        logger.error(err);
        throw err;
    }
};


// can be integrated later on when userbase becomes big (not soon)
const _sugggestUsernames = (usernameInput) =>{
    const suggestions = [];
    for (let i = 1; i <= 3; i++) {
      suggestions.push(`${username}${Math.floor(Math.random() * 1000)}`);
    }
    return suggestions;
}

module.exports._doesThisCustomerExists = _doesThisCustomerExists;
module.exports._getCookieToken = _getCookieToken;
module.exports._getUserUsingId = _getUserUsingId;
module.exports._updateUserInfoUsingGivenData = _updateUserInfoUsingGivenData;
module.exports._createUser = _createUser;
module.exports._deleteUser = _deleteUser;
module.exports._saveProjectInUser = _saveProjectInUser;
module.exports._getUsernamesInProject = _getUsernamesInProject;