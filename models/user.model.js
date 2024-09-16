const { Schema, default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const customerSchema = new Schema({
    username : {
        type : String,
        required : true,
    },
    phoneNumber : {
        type : String,
        required : true,
    },
    companyName : {
        type : String,
        required : true,
        default : "Own Project"
    },
    designationInCompany : {
        type : String,
        required : false,
        default : "Self Employed"
    },
    emailId : {
        type : String,
        required : true,
    },
    password : {
        type : String,
        required : true,
        select : false,
    },
    isEmailIdVerified : {
        type : Boolean,
        required : false,
    },
    customerPlan : {
        type : String,
        required : true,
        default : "Free"
    },
    projects : {
        type : Schema.Types.ObjectId,
        ref : "project"
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    createdAt : {
        type : Date,
        default : Date.now
    }
});

customerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      return next;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });
  
  // validate passwords with the db
  customerSchema.methods.isPasswordValid = async function (usersendPassword) {
    return await bcrypt.compare(usersendPassword, this.password);
  };
  
  // create and return jwt token
  // whenever we save anything in mongoDB it generates an Id for us
  customerSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });
  };
  
  // simply to generate forgot password token(string)
  customerSchema.methods.getForgotPasswordToken = function () {
    // generate a long and random string
    const forgotToken = crypto.randomBytes(20).toString("hex");
  
    //   field in the model is updated by this
    //   getting a hash - make sure to get a hash on backend as well
    //   whenver user sends back this token run the same function as below and compare the hash
    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(forgotToken)
      .digest("hex");
  
    // time of token
    this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;
  
    return forgotToken;
  };
  

module.exports = mongoose.model("user",customerSchema);