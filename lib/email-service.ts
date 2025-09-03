// Email Service Utility
// This file provides a centralized way to send emails for the application
// You can integrate with any email service provider (SendGrid, AWS SES, etc.)

export interface EmailData {
  to: string
  subject: string
  content: string
  htmlContent?: string
}

export interface WelcomeEmailData {
  fullName: string
  temporaryPassword: string
  loginUrl: string
}

export interface RejectionEmailData {
  reason: string
  notes?: string
}

export interface InformationRequestEmailData {
  message: string
}

// Send welcome email with credentials
export async function sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<boolean> {
  try {
    const emailData: EmailData = {
      to: email,
      subject: 'Account Created - Cash Call Management System',
      content: `
Welcome to the Cash Call Management System!

Your account has been approved and created by IT.

Login Credentials:
Email: ${email}
Temporary Password: ${data.temporaryPassword}

Please change your password after first login.

Login at: ${data.loginUrl}

If you have any questions, contact IT support.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Welcome to the Cash Call Management System!</h2>
          <p>Your account has been approved and created by IT.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
          </div>
          
          <p><strong>Important:</strong> Please change your password after first login.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login Now
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, contact IT support.
          </p>
        </div>
      `
    }

    return await sendEmail(emailData)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}

// Send rejection email
export async function sendRejectionEmail(email: string, data: RejectionEmailData): Promise<boolean> {
  try {
    const emailData: EmailData = {
      to: email,
      subject: 'Account Request Status - Cash Call Management System',
      content: `
Thank you for your interest in the Cash Call Management System.

Unfortunately, your account request has been rejected.

Reason: ${data.reason}
${data.notes ? `Notes: ${data.notes}` : ''}

If you believe this was an error or have additional information to provide, please contact IT support.

Thank you for your understanding.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Account Request Status</h2>
          <p>Thank you for your interest in the Cash Call Management System.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #dc2626; margin: 0;"><strong>Unfortunately, your account request has been rejected.</strong></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reason:</strong> ${data.reason}</p>
            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          
          <p>If you believe this was an error or have additional information to provide, please contact IT support.</p>
          
          <p style="color: #6b7280;">Thank you for your understanding.</p>
        </div>
      `
    }

    return await sendEmail(emailData)
  } catch (error) {
    console.error('Error sending rejection email:', error)
    return false
  }
}

// Send information request email
export async function sendInformationRequestEmail(email: string, data: InformationRequestEmailData): Promise<boolean> {
  try {
    const emailData: EmailData = {
      to: email,
      subject: 'Additional Information Required - Cash Call Management System',
      content: `
Thank you for your account request for the Cash Call Management System.

IT has reviewed your request and needs additional information before proceeding:

${data.message}

Please provide the requested information by replying to this email or contacting IT support directly.

Your request will remain pending until this information is received.

Thank you for your cooperation.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Additional Information Required</h2>
          <p>Thank you for your account request for the Cash Call Management System.</p>
          
          <p>IT has reviewed your request and needs additional information before proceeding:</p>
          
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>${data.message}</strong></p>
          </div>
          
          <p>Please provide the requested information by replying to this email or contacting IT support directly.</p>
          
          <p><strong>Note:</strong> Your request will remain pending until this information is received.</p>
          
          <p style="color: #6b7280;">Thank you for your cooperation.</p>
        </div>
      `
    }

    return await sendEmail(emailData)
  } catch (error) {
    console.error('Error sending information request email:', error)
    return false
  }
}

// Send notification to admin users about new account requests
export async function notifyAdminsOfNewRequest(requestData: any): Promise<boolean> {
  try {
    // This would typically fetch admin emails from the database
    // For now, we'll use environment variables or a hardcoded list
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',') || []
    
    if (adminEmails.length === 0) {
      console.log('No admin emails configured for notifications')
      return true
    }

    const emailData: EmailData = {
      to: adminEmails.join(','),
      subject: 'New Account Request - Action Required',
      content: `
New Account Request Received

Name: ${requestData.full_name}
Email: ${requestData.email}
Position: ${requestData.position}
Department: ${requestData.department}
Reason: ${requestData.reason_for_access}
Manager: ${requestData.manager_name} (${requestData.manager_email})

Please review and approve/reject this request.

Login to the admin panel to take action.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">New Account Request - Action Required</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Request Details:</h3>
            <p><strong>Name:</strong> ${requestData.full_name}</p>
            <p><strong>Email:</strong> ${requestData.email}</p>
            <p><strong>Position:</strong> ${requestData.position}</p>
            <p><strong>Department:</strong> ${requestData.department}</p>
            <p><strong>Reason:</strong> ${requestData.reason_for_access}</p>
            <p><strong>Manager:</strong> ${requestData.manager_name} (${requestData.manager_email})</p>
          </div>
          
          <p><strong>Action Required:</strong> Please review and approve/reject this request.</p>
          
          <p style="color: #6b7280;">Login to the admin panel to take action.</p>
        </div>
      `
    }

    return await sendEmail(emailData)
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return false
  }
}

// Main email sending function
// This is where you would integrate with your chosen email service provider
async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // TODO: Integrate with your email service provider
    // Examples:
    
    // For SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send(emailData)
    
    // For AWS SES:
    // const AWS = require('aws-sdk')
    // const ses = new AWS.SES()
    // await ses.sendEmail({
    //   Source: process.env.FROM_EMAIL,
    //   Destination: { ToAddresses: [emailData.to] },
    //   Message: {
    //     Subject: { Data: emailData.subject },
    //     Body: { Text: { Data: emailData.content } }
    //   }
    // }).promise()
    
    // For now, just log the email (for development/testing)
    console.log('=== EMAIL WOULD BE SENT ===')
    console.log('To:', emailData.to)
    console.log('Subject:', emailData.subject)
    console.log('Content:', emailData.content)
    console.log('============================')
    
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Export the main function for direct use
export { sendEmail }
