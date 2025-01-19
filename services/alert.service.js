const { _getProjectById, _getOnCallPersonFromProjectId } = require("../utils/project.utils");
const logger = require("logat");
const nodemailer = require("nodemailer");
// const twilio = require("twilio");
const moment = require("moment");
const { _addIncidentSteps } = require("../utils/incident.utils");
require('dotenv').config();
const suppotConfirmationTemplate = require("../templates/supportRequestConfirmationEmailTemplate.js");
const supportRequestTemplate = require("../templates/supportRequestEmailToInternal.js");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM, 
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

const _getEmailOptions = (emailId, apiObj) => {
    return {
      from: "Alerts" +process.env.EMAIL_FROM, // Your email
      to: emailId, // Recipient email
      subject: `⚠️ Alert for API: ${apiObj.apiEndPoint}`, // Subject of the email
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
          <thead>
            <tr>
              <th style="background-color: #FF6347; padding: 10px; text-align: center; color: #fff; font-size: 24px; border-radius: 8px 8px 0 0;">
                ⚠️ API Alert Notification
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 20px; background-color: #f9f9f9; color: #555;">
                <p style="font-size: 18px; font-weight: bold; color: #333;">An alert has been triggered for the API: <strong>${apiObj.apiEndPoint}</strong></p>
                <p style="font-size: 16px;">This alert was triggered at <strong>${moment().format('lll')}</strong>.</p>
                <p style="font-size: 16px; color: #FF6347;">Please review the API and take necessary actions.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background-color: #ffffff;">
                <table style="width: 100%; text-align: center;">
                  <tr>
                    <td style="font-size: 16px; color: #fff; background-color: #333; padding: 10px; border-radius: 4px;">
                      <a href="https://your-dashboard-link.com" style="color: #fff; text-decoration: none;">View API Dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background-color: #f1f1f1; text-align: center;">
                <p style="font-size: 14px; color: #888;">This is an automated alert. Please do not reply.</p>
                <p style="font-size: 14px; color: #888;">For support, visit our <a href="https://support-link.com" style="color: #FF6347; text-decoration: none;">Help Center</a>.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      `,
    };
  };
  

const _getSMSOptions = (onCallPerson, apiObj) => {
  return {
    body: `ALERT: API ${apiObj.apiEndPoint} has triggered an alert at ${moment().format('lll')}.`, // SMS body
    from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
    to: onCallPerson.onCallPersonPhoneNumber // On-call person’s phone number
  };
};

// Main function to send alert
const sendAlert = async (apiObj) => {
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
    let emailOptions = _getEmailOptions(onCallPerson.onCallPersonEmail, apiObj);
    await _sendEmail(emailOptions); 
    let emailSteps = {
      incidentTime : `${moment().format("lll")}`,
      step : `Email Sent to ${onCallPerson.onCallPersonEmail} at ${moment().format('lll')}`,
    }

    await _addIncidentSteps(emailSteps,apiObj._id);
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

const _parseEmailTemplateForSupportRequests = (template,values) =>{
  const { name, email, message } = values;

    return template
        .replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{message}}/g, message);

}

const sendSupportRequestsToEmail = async (name, email , message) => {
  try{

    const parsedEmailInternal = _parseEmailTemplateForSupportRequests(supportRequestTemplate,{name,email,message});
    const parsedEmailForCustomer = _parseEmailTemplateForSupportRequests(suppotConfirmationTemplate,{name,email,message});
    
  let supportEmailOptionsForInternal = {
    from: "Support Notification" + process.env.EMAIL_FROM, 
      to: "shreejisventures@gmail.com",
      subject: `New Support Request Raised for : ${name}`,
      html : parsedEmailInternal
    }
    
    await _sendEmail(supportEmailOptionsForInternal);
    
    let supportEmailConfirmationForCustomer = {
      from: "Support Notification" + process.env.EMAIL_FROM, 
      to: email,
      subject: `Garuda Support: Request Received and Under Review`,
      html : parsedEmailForCustomer
    }
    
    await _sendEmail(supportEmailConfirmationForCustomer);
  }catch(err){
    logger.error(`Error || Error in sending support email confirmation to customer : ${email}`);
    logger.error(err);
    throw err;
  }
}

module.exports = {
  sendAlert,
  sendSupportRequestsToEmail
};
