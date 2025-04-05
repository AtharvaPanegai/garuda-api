const { _getProjectById, _getOnCallPersonFromProjectId } = require("../utils/project.utils");
const logger = require("logat");
const nodemailer = require("nodemailer");
// const twilio = require("twilio");
const moment = require("moment");
const { _addIncidentSteps } = require("../utils/incident.utils");
require('dotenv').config();
const suppotConfirmationTemplate = require("../templates/supportRequestConfirmationEmailTemplate.js");
const supportRequestTemplate = require("../templates/supportRequestEmailToInternal.js");
const alertEmailTemplate = require("../templates/alert.email.template.js");


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_AUTH_TOKEN,
  },
});

// Configure Twilio for sending SMS
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const _sendEmail = async (emailOptions) => {
  try {
    let info = await transporter.sendMail(emailOptions);
    logger.info(`INFO || Email sent: ${info.response}`);
  } catch (err) {
    logger.error(`Error || Error in sending email: ${err}`);
    throw err;
  }
};

const _sendSMS = async (smsOptions) => {
  try {
    let message = await twilioClient.messages.create(smsOptions);
    logger.info(`INFO || SMS sent: ${message.sid}`);
  } catch (err) {
    logger.error(`Error || Error in sending SMS: ${err}`);
    throw err;
  }
};


const _getSMSOptions = (onCallPerson, apiObj) => {
  return {
    body: `ALERT: API ${apiObj.apiEndPoint} has triggered an alert at ${moment().format('lll')}.`, // SMS body
    from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
    to: onCallPerson.onCallPersonPhoneNumber // On-call person’s phone number
  };
};

// Main function to send alert
const sendAlert = async (apiObj, apiLogInfo) => {
  let projectId = apiObj.project;
  let onCallPerson;

  try {
    onCallPerson = await _getOnCallPersonFromProjectId(projectId);
  } catch (err) {
    logger.error(`Error || Error in getting onCall Person while sending Alert for API: ${apiObj._id}`);
    logger.error(err);
    return;
  }

  // Check if on-call person has an email configured
  if (onCallPerson?.onCallPersonEmail) {
    logger.info(`INFO || Sending Email Alert for API: ${apiObj._id} at ${moment().format('lll')}`);

    let alertEmailParsed = _parseAlertEmailTemplate(apiLogInfo);

    const emailOptions = {
      from: `Garuda Alerts <${process.env.EMAIL_FROM}>`,
      to: onCallPerson.onCallPersonEmail,
      subject: `ALERT: API ${apiObj.apiEndPoint} is Down`,
      html: alertEmailParsed
    }

    await _sendEmail(emailOptions);
    let emailSteps = {
      incidentTime: `${moment().format("lll")}`,
      step: `Email Sent to ${onCallPerson.onCallPersonEmail} at ${moment().format('lll')}`,
    }

    await _addIncidentSteps(emailSteps, apiObj._id);
  }

  // Check if on-call person has a phone number configured
  //   if (onCallPerson?.onCallPersonPhoneNumber) {
  //     logger.info(`INFO || Sending SMS Alert for API: ${apiObj._id} at ${moment().format("lll")}`);
  //     let smsOptions = _getSMSOptions(onCallPerson, apiObj);
  //     await _sendSMS(smsOptions); // Send SMS
  //   }

  // If no contact methods are configured, log an error
  if (!onCallPerson?.onCallPersonEmail && !onCallPerson?.onCallPersonPhoneNumber) {
    logger.error(`Error || OnCall Person not configured for this project: ${projectId} & Unable to send updates to onCall Person for API: ${apiObj._id}`);
  }

  return;
};

const _parseEmailTemplateForSupportRequests = (template, values) => {
  const { name, email, message } = values;

  return template
    .replace(/{{name}}/g, name)
    .replace(/{{email}}/g, email)
    .replace(/{{message}}/g, message);

}

const _parseAlertEmailTemplate = (values) => {
  const { path, statusCode, responseTime } = values;
  const timeStamp = moment().format("lll");

  return alertEmailTemplate
    .replace(/{{apiPath}}/g, path)
    .replace(/{{statusCode}}/g, statusCode)
    .replace(/{{timeStamp}}/g, timeStamp)
    .replace(/{{responseTime}}/g, responseTime);
}

const sendSupportRequestsToEmail = async (name, email, message) => {
  try {

    const parsedEmailInternal = _parseEmailTemplateForSupportRequests(supportRequestTemplate, { name, email, message });
    const parsedEmailForCustomer = _parseEmailTemplateForSupportRequests(suppotConfirmationTemplate, { name, email, message });

    let supportEmailOptionsForInternal = {
      from: "Support Notification" + process.env.EMAIL_FROM,
      to: "shreejisventures@gmail.com",
      subject: `New Support Request Raised for : ${name}`,
      html: parsedEmailInternal
    }

    await _sendEmail(supportEmailOptionsForInternal);

    let supportEmailConfirmationForCustomer = {
      from: "Support Notification" + process.env.EMAIL_FROM,
      to: email,
      subject: `Garuda Support: Request Received and Under Review`,
      html: parsedEmailForCustomer
    }

    await _sendEmail(supportEmailConfirmationForCustomer);
  } catch (err) {
    logger.error(`Error || Error in sending support email confirmation to customer : ${email}`);
    logger.error(err);
    throw err;
  }
}

module.exports = {
  sendAlert,
  sendSupportRequestsToEmail
};
