const User = require("../models/userModel")

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


module.exports._doesThisCustomerExists = _doesThisCustomerExists;
module.exports._getCookieToken = _getCookieToken;
module.exports._getUserUsingId = _getUserUsingId;
module.exports._updateUserInfoUsingGivenData = _updateUserInfoUsingGivenData;
module.exports._createUser = _createUser;
module.exports._deleteUser = _deleteUser;