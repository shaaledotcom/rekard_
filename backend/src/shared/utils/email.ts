// Email service using Resend
import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { log } from '../middleware/logger.js';

let resend: Resend | null = null;

// Initialize Resend client
const getResendClient = (): Resend | null => {
  if (!env.email.resendApiKey) {
    log.warn('RESEND_API_KEY not configured, email sending will be disabled');
    return null;
  }

  if (!resend) {
    resend = new Resend(env.email.resendApiKey);
  }

  return resend;
};

// Email template types
export interface PurchaseConfirmationEmailData {
  recipientEmail: string;
  recipientName?: string;
  orderNumber: string;
  ticketTitle: string;
  ticketDescription?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  eventTitle?: string;
  eventStartDatetime?: Date;
  watchLink?: string;
}

export interface AccessGrantEmailData {
  recipientEmail: string;
  recipientName?: string;
  ticketTitle: string;
  ticketDescription?: string;
  eventTitle?: string;
  eventStartDatetime?: Date;
  watchLink?: string;
  expiresAt?: Date;
}

// Generate HTML email template for purchase confirmation
const generatePurchaseConfirmationHTML = (data: PurchaseConfirmationEmailData): string => {
  const formattedPrice = `${data.currency} ${data.totalAmount.toFixed(2)}`;
  const eventInfo = data.eventTitle
    ? `<p><strong>Event:</strong> ${data.eventTitle}</p>`
    : '';
  const eventDate = data.eventStartDatetime
    ? `<p><strong>Date:</strong> ${new Date(data.eventStartDatetime).toLocaleString()}</p>`
    : '';
  const watchLinkSection = data.watchLink
    ? `<div style="margin: 30px 0; text-align: center;">
        <a href="${data.watchLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Watch Now</a>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: #007bff; margin-top: 0;">Purchase Confirmed!</h1>
    <p>Thank you for your purchase. Your order has been confirmed.</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Order Details</h2>
    <p><strong>Order Number:</strong> ${data.orderNumber}</p>
    <p><strong>Ticket:</strong> ${data.ticketTitle}</p>
    ${data.ticketDescription ? `<p><strong>Description:</strong> ${data.ticketDescription}</p>` : ''}
    ${eventInfo}
    ${eventDate}
    <p><strong>Quantity:</strong> ${data.quantity}</p>
    <p><strong>Unit Price:</strong> ${data.currency} ${data.unitPrice.toFixed(2)}</p>
    <p style="font-size: 18px; font-weight: bold; color: #007bff; margin-top: 20px;">
      <strong>Total Amount:</strong> ${formattedPrice}
    </p>
  </div>

  ${watchLinkSection}

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p>If you have any questions, please contact us at ${env.email.supportEmail}</p>
    <p style="margin-top: 10px;">© ${new Date().getFullYear()} ${env.email.fromName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
};

// Generate HTML email template for access grant
const generateAccessGrantHTML = (data: AccessGrantEmailData): string => {
  const eventInfo = data.eventTitle
    ? `<p><strong>Event:</strong> ${data.eventTitle}</p>`
    : '';
  const eventDate = data.eventStartDatetime
    ? `<p><strong>Date:</strong> ${new Date(data.eventStartDatetime).toLocaleString()}</p>`
    : '';
  const expiresInfo = data.expiresAt
    ? `<p><strong>Access Expires:</strong> ${new Date(data.expiresAt).toLocaleString()}</p>`
    : '';
  const watchLinkSection = data.watchLink
    ? `<div style="margin: 30px 0; text-align: center;">
        <a href="${data.watchLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Content</a>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Granted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
    <h1 style="color: #155724; margin-top: 0;">Access Granted!</h1>
    <p>You have been granted access to the following content.</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Content Details</h2>
    <p><strong>Ticket:</strong> ${data.ticketTitle}</p>
    ${data.ticketDescription ? `<p><strong>Description:</strong> ${data.ticketDescription}</p>` : ''}
    ${eventInfo}
    ${eventDate}
    ${expiresInfo}
  </div>

  ${watchLinkSection}

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p>If you have any questions, please contact us at ${env.email.supportEmail}</p>
    <p style="margin-top: 10px;">© ${new Date().getFullYear()} ${env.email.fromName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
};

// Send purchase confirmation email
export const sendPurchaseConfirmationEmail = async (
  data: PurchaseConfirmationEmailData
): Promise<boolean> => {
  log.info(`[EMAIL] Attempting to send purchase confirmation email to ${data.recipientEmail} for order ${data.orderNumber}`);
  
  const client = getResendClient();
  if (!client) {
    log.warn('[EMAIL] Resend client not available, skipping purchase confirmation email');
    return false;
  }

  try {
    const emailSubject = `Purchase Confirmation - Order ${data.orderNumber}`;
    log.info(`[EMAIL] Sending purchase confirmation email - To: ${data.recipientEmail}, Subject: ${emailSubject}, Order: ${data.orderNumber}, Ticket: ${data.ticketTitle}`);
    
    const result = await client.emails.send({
      from: `${env.email.fromName} <${env.email.fromEmail}>`,
      to: [data.recipientEmail],
      subject: emailSubject,
      html: generatePurchaseConfirmationHTML(data),
    });

    if (result.error) {
      log.error(`[EMAIL] Failed to send purchase confirmation email to ${data.recipientEmail} for order ${data.orderNumber}:`, result.error);
      return false;
    }

    log.info(`[EMAIL] Successfully sent purchase confirmation email to ${data.recipientEmail} for order ${data.orderNumber} (Email ID: ${result.data?.id || 'unknown'})`);
    return true;
  } catch (error) {
    log.error(`[EMAIL] Error sending purchase confirmation email to ${data.recipientEmail} for order ${data.orderNumber}:`, error);
    return false;
  }
};

// Send access grant email
export const sendAccessGrantEmail = async (
  data: AccessGrantEmailData
): Promise<boolean> => {
  log.info(`[EMAIL] Attempting to send access grant email to ${data.recipientEmail} for ticket ${data.ticketTitle}`);
  
  const client = getResendClient();
  if (!client) {
    log.warn('[EMAIL] Resend client not available, skipping access grant email');
    return false;
  }

  try {
    const emailSubject = `Access Granted - ${data.ticketTitle}`;
    log.info(`[EMAIL] Sending access grant email - To: ${data.recipientEmail}, Subject: ${emailSubject}, Ticket: ${data.ticketTitle}`);
    
    const result = await client.emails.send({
      from: `${env.email.fromName} <${env.email.fromEmail}>`,
      to: [data.recipientEmail],
      subject: emailSubject,
      html: generateAccessGrantHTML(data),
    });

    if (result.error) {
      log.error(`[EMAIL] Failed to send access grant email to ${data.recipientEmail} for ticket ${data.ticketTitle}:`, result.error);
      return false;
    }

    log.info(`[EMAIL] Successfully sent access grant email to ${data.recipientEmail} for ticket ${data.ticketTitle} (Email ID: ${result.data?.id || 'unknown'})`);
    return true;
  } catch (error) {
    log.error(`[EMAIL] Error sending access grant email to ${data.recipientEmail} for ticket ${data.ticketTitle}:`, error);
    return false;
  }
};

