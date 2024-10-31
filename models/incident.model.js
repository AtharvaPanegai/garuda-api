const { Schema, default: mongoose } = require("mongoose");

const incidentSchema = new Schema({
    project : {
        type : Schema.Types.ObjectId,
        ref : "project"
    },
    apiId: {
        type: Schema.Types.ObjectId,
        ref: "apiModel",
        required: true
    },
    timeOfIncident : {
        type : String,
        required : true,
    },
    firstFailedApiLog : {
        type : Object,
        required : true
    },
    stepsAfterFailure : [{
        type : Object
    }],
    totalFailedApiCalls : {
        type : Number,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

module.exports = mongoose.model("incident",incidentSchema);