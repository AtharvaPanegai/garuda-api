const { Schema, default: mongoose } = require("mongoose");

const customerSchema = new Schema({
    username : {
        type : String,
        required : true,
    },
    customerPlan : {
        type : String,
        required : true,
    },
    projects : {
        type : Schema.Types.ObjectId,
        required : true,
    }
});

module.exports = mongoose.model("customer",customerSchema);