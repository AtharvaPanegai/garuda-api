exports.customRole = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new CustomError("You are not allowed for this resource", 403)
        );
      }
      next(); 
    };
  };
  