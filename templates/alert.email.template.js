const emailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Garuda Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <!-- Email Container -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Email Content -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #2D0A42; padding: 20px;">
              <!-- Logo placeholder - replace with your actual logo URL -->
              <img src="https://apigaruda.com/logo.png" alt="Garuda Logo" style="height: 40px; margin-bottom: 10px;">
              <h1 style="color: #ffffff; margin: 10px 0; font-size: 24px;">API Alert Notification</h1>
            </td>
          </tr>
          
          <!-- Alert Status - ERROR VERSION -->
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFEBEE; border-left: 5px solid #F44336; padding: 15px;">
                <tr>
                  <td>
                    <h2 style="color: #D32F2F; margin: 0 0 10px 0; font-size: 18px;">API Error Detected</h2>
                    <p style="margin: 0; color: #424242;">We've detected an issue with your API that requires attention.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Alert Details -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <h3 style="color: #2D0A42; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">Alert Details</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #757575;">Endpoint:</td>
                  <td style="padding: 8px 0; color: #212121; font-family: monospace; background-color: #F5F5F5; padding: 2px 5px;">{{apiPath}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #757575;">Status Code:</td>
                  <td style="padding: 8px 0; color: #D32F2F; font-weight: bold;">{{statusCode}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #757575;">Timestamp:</td>
                  <td style="padding: 8px 0; color: #212121;">{{timeStamp}}</td>
                </tr>
                <!-- <tr>
                  <td style="padding: 8px 0; color: #757575;">Error Message:</td>
                  <td style="padding: 8px 0; color: #D32F2F;">Internal Server Error: Database connection timeout</td>
                </tr> -->
                <tr>
                  <td style="padding: 8px 0; color: #757575;">Response Time:</td>
                  <td style="padding: 8px 0; color: #212121;">{{responseTime}}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Recommendations -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <h3 style="color: #2D0A42; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">Recommended Actions</h3>
              <ul style="padding-left: 20px; color: #424242;">
                <li style="margin: 8px 0;">Check your API endpoint configuration</li>
                <li style="margin: 8px 0;">Verify server resources and availability</li>
                <li style="margin: 8px 0;">Review recent code deployments</li>
                <li style="margin: 8px 0;">Check third-party service dependencies</li>
              </ul>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 10px 20px 30px 20px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #9C27B0; border-radius: 4px; padding: 12px 24px;">
                    <a href="https://apigaruda.com/dashboard" style="color: #FFFFFF; text-decoration: none; font-weight: bold; display: inline-block;">View in Dashboard</a>
                  </td>
                </tr>
              </table>
              <p style="color: #757575; font-size: 14px; margin: 20px 0 0 0;">
                For detailed analytics and real-time monitoring, visit your Garuda dashboard.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #F5F5F5; padding: 20px; color: #757575; font-size: 12px;">
              <p style="margin: 0 0 10px 0;">
                This is an automated alert from Garuda API Observability Platform.
              </p>
              <p style="margin: 0 0 10px 0;">
                <a href="https://apigaruda.com/settings" style="color: #9C27B0; text-decoration: none;">
                  Manage notification settings
                </a> | 
                <a href="https://apigaruda.com/docs" style="color: #9C27B0; text-decoration: none; margin-left: 5px;">
                  Documentation
                </a>
              </p>
              <p style="margin: 10px 0 0 0;">
                © 2025 Shreejis Ventures. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

module.exports = emailTemplate;
