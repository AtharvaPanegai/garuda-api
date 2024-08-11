const customerModel = require("../models/customerModel")

const _doesThisCustomerExists = async (customerId) => {
    let customer = await customerModel.findById(customerId);
    if (customer) {
        return true;
    }
    return false;
}


module.exports._doesThisCustomerExists = _doesThisCustomerExists;
