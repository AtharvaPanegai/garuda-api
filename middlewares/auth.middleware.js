const User = require("../models/userModel");
const CustomError = require("../utils/customError");
const jwt = require("jsonwebtoken");
const BigPromise = require("./BigPromise");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    return next(new CustomError("Login First To Access this page", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id);

  next();
});

