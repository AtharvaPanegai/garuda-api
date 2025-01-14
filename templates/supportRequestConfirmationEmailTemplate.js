const emailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Request Received</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #9333EA;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
        }
        .message {
            margin-bottom: 20px;
        }
        .field {
            margin-bottom: 20px;
        }
        .label {
            font-weight: bold;
            color: #9333EA;
        }
        .value {
            margin-top: 5px;
            padding: 10px;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Support Request Received</h1>
    </div>
    <div class="content">
        <div class="message">
            <p>Dear {{name}},</p>
            <p>Thank you for contacting Garuda support. We have received your request and will get back to you as soon as possible. Here's a summary of your message:</p>
        </div>
        <div class="field">
            <div class="label">Name:</div>
            <div class="value">{{name}}</div>
        </div>
        <div class="field">
            <div class="label">Email:</div>
            <div class="value">{{email}}</div>
        </div>
        <div class="field">
            <div class="label">Message:</div>
            <div class="value">{{message}}</div>
        </div>
        <div class="message">
            <p>Our team will review your request and respond promptly. If you have any additional information to add, please reply to this email.</p>
            <p>Thank you for choosing Garuda for your API monitoring needs.</p>
        </div>
    </div>
    <div class="footer">
        <p>© 2024 Garuda. All rights reserved.</p>
    </div>
</body>
</html>`

module.exports = emailTemplate;
