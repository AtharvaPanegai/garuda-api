const User = require("../models/userModel")

const _doesThisCustomerExists = async (customerId) => {
    let customer = await User.findById(customerId);
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




module.exports._doesThisCustomerExists = _doesThisCustomerExists;
module.exports._getCookieToken = _getCookieToken;