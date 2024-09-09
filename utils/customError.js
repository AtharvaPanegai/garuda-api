class CustomError extends Error {
    constructor(message, code, details = {}) {
        super(message)

        this.code = code;
        this.details = details;

        // we'll be excluding all the noise data from stack trace
        if(Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }

    // For debugging purpose
    logError() {
        console.error(`Error: ${this.message}, Code: ${this.code}, Details: ${JSON.stringify(this.details)}`);
    }
}

module.exports = CustomError;