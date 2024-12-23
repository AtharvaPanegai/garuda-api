const { Schema, default: mongoose } = require("mongoose");

const apiSchema = new Schema({
    apiEndPoint : {
        type : String,
        required : true,
        unique : true
    },
    apiMethod : {
        type : String,
        required : true,
    },
    project : {
        type : Schema.Types.ObjectId,
        ref:"project"
    },
    customer : {
        type : Schema.Types.ObjectId,
        ref : "customer"
    },
    isCurrentlyDown : {
        type : Boolean,
        required : false,
    },
    isRadarEnabled : {
        type : Boolean,
        required : false
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

module.exports = mongoose.model("apiModel",apiSchema);