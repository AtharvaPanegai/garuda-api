const emailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Support Request</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>New Support Request</h1>
    </div>
    <div class="content">
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
    </div>
</body>
</html>`

module.exports = emailTemplate;
