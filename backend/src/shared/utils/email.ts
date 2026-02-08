// Email service using Resend
import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { log } from '../middleware/logger.js';
import * as tenantService from '../../domains/tenant/service.js';
import { generateICalContent } from './ical.js';

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
  ticketThumbnailUrl?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  eventTitle?: string;
  eventStartDatetime?: Date;
  eventEndDatetime?: Date;
  watchLink?: string;
  tenantId?: string;
  appId?: string;
}

export interface AccessGrantEmailData {
  recipientEmail: string;
  recipientName?: string;
  ticketTitle: string;
  ticketDescription?: string;
  ticketThumbnailUrl?: string;
  eventTitle?: string;
  eventStartDatetime?: Date;
  eventEndDatetime?: Date;
  watchLink?: string;
  expiresAt?: Date;
  tenantId?: string;
  appId?: string;
}

// Helper function to format datetime
const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper function to make watch link absolute based on tenant platform settings
const makeAbsoluteWatchLink = async (
  watchLink: string | undefined,
  tenantId?: string
): Promise<string> => {
  if (!watchLink) return '';
  
  // If already absolute, return as is
  if (watchLink.startsWith('http://') || watchLink.startsWith('https://')) {
    return watchLink;
  }
  
  // Try to get tenant's primary domain if tenantId is provided
  let domain: string | undefined;
  if (tenantId) {
    try {
      const tenant = await tenantService.getTenantById(tenantId);
      if (tenant?.primary_domain) {
        domain = tenant.primary_domain;
      }
    } catch (error) {
      log.warn(`[EMAIL] Failed to fetch tenant ${tenantId} for domain resolution:`, error);
    }
  }
  
  // Fall back to shared domains if no tenant domain found
  if (!domain) {
    domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
  }
  
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  
  // Ensure watchLink starts with /
  const cleanLink = watchLink.startsWith('/') ? watchLink : `/${watchLink}`;
  
  return `${protocol}://${domain}${cleanLink}`;
};

// Generate HTML email template for purchase confirmation
const generatePurchaseConfirmationHTML = async (data: PurchaseConfirmationEmailData): Promise<string> => {
  const ticketName = data.ticketTitle;
  const eventStartDateTime = data.eventStartDatetime ? formatDateTime(data.eventStartDatetime) : 'TBD';
  const eventEndDateTime = data.eventEndDatetime ? formatDateTime(data.eventEndDatetime) : '';
  const eventDateTimeRange = eventEndDateTime 
    ? `${eventStartDateTime} - ${eventEndDateTime}`
    : eventStartDateTime;
  const amountPaid = `${data.currency} ${data.totalAmount.toFixed(2)}`;
  const absoluteWatchLink = await makeAbsoluteWatchLink(data.watchLink, data.tenantId);
  
  // Get domain for display (same logic as makeAbsoluteWatchLink)
  let domain: string;
  if (data.tenantId) {
    try {
      const tenant = await tenantService.getTenantById(data.tenantId);
      if (tenant?.primary_domain) {
        domain = tenant.primary_domain;
      } else {
        domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
      }
    } catch {
      domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
    }
  } else {
    domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
  }
  
  // Ticket thumbnail - use provided thumbnail or hide the section
  const ticketThumbnailSection = data.ticketThumbnailUrl
    ? `<div style="text-align: center; margin-bottom: 28px;">
        <img src="${data.ticketThumbnailUrl}" alt="${ticketName}" style="max-width: 200px; height: auto; border-radius: 8px;">
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${ticketName} - Ticket confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 28px; color: #111827; font-weight: 600;">Your ticket is confirmed.</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              ${ticketThumbnailSection}
              
              <!-- Ticket Details Highlight -->
              <div style="text-align: center; margin-bottom: 28px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ticket</p>
                <p style="margin: 0 0 4px 0; font-size: 24px; color: #111827; font-weight: 700; line-height: 1.3;">${ticketName}</p>
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">${eventDateTimeRange}</p>
                <p style="margin: 0; font-size: 16px; color: #2563eb; font-weight: 600;">Amount Paid: ${amountPaid}</p>
  </div>

              ${absoluteWatchLink ? `<!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${absoluteWatchLink}" style="display: inline-block; padding: 16px 48px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; min-width: 200px;">Watch</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Or copy this link:</p>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; word-break: break-all; font-size: 14px; color: #374151; margin-bottom: 40px;">
                ${absoluteWatchLink}
              </div>` : ''}
              
              <!-- Steps to Access -->
              ${absoluteWatchLink ? `<div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">Steps to Access</h2>
                <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px;">
                  <li style="margin-bottom: 12px;">Go to <strong>${absoluteWatchLink}</strong> on your browser (Chrome / Safari / Firefox / Opera).</li>
                  <li style="margin-bottom: 12px;">Login with OTP with <strong>${data.recipientEmail}</strong></li>
                </ol>
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">You can verify if you have access with the account under "My Purchases" on <strong>${domain}</strong></p>
              </div>` : ''}
              
              <!-- Please Note (adapted for livestream/VOD) -->
              <div style="border-left: 4px solid #fbbf24; background-color: #fffbeb; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827; font-weight: 600;">Please Note</h2>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.7;">
                  <li style="margin-bottom: 8px;">This event is available for <strong>web-only viewing</strong> on any modern browser.</li>
                  <li style="margin-bottom: 8px;">All content is copyrighted and protected.</li>
                  <li style="margin-bottom: 0;">Sharing, recording, or distributing this content is strictly prohibited.</li>
                </ul>
  </div>

              <!-- Troubleshooting -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">Troubleshooting</h2>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">If you're having trouble accessing the event:</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  ${absoluteWatchLink ? `<li style="margin-bottom: 8px;">Please make sure you are on the link - <span style="color: #2563eb;">${absoluteWatchLink}</span></li>` : ''}
                  <li style="margin-bottom: 8px;">Make sure you have logged in with the same email address with which you made the purchase with or you have been given access to.</li>
                  <li style="margin-bottom: 8px;">For uninterrupted access / viewing experience, you will need at-least 3 MBPS download speed on your device. Kindly check your speeds at <a href="http://speedtest.net/" style="color: #2563eb;">speedtest.net</a> or <a href="http://testmy.net/" style="color: #2563eb;">testmy.net</a></li>
                  <li style="margin-bottom: 8px;">If you are facing any issues logging in or accessing the video, kindly clear the cookies / cache / history on your browser or try accessing on a different browser / device / network</li>
                  <li style="margin-bottom: 8px;">Based on your internet speed / connectivity you could choose to higher / lower the quality of the stream using the Gear icon on the video player. We suggest you reduce the quality of the stream if the internet is inconsistent or the video is buffering for you to have a continuous playback</li>
                  <li style="margin-bottom: 0;">For any help, reachout to support. Contact information available in the footer.</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                You received this email because you purchased or were granted access to an event.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Generate HTML email template for access grant
const generateAccessGrantHTML = async (data: AccessGrantEmailData): Promise<string> => {
  const ticketName = data.ticketTitle;
  const eventStartDateTime = data.eventStartDatetime ? formatDateTime(data.eventStartDatetime) : 'TBD';
  const eventEndDateTime = data.eventEndDatetime ? formatDateTime(data.eventEndDatetime) : '';
  const eventDateTimeRange = eventEndDateTime 
    ? `${eventStartDateTime} - ${eventEndDateTime}`
    : eventStartDateTime;
  const absoluteWatchLink = await makeAbsoluteWatchLink(data.watchLink, data.tenantId);
  
  // Get domain for display (same logic as makeAbsoluteWatchLink)
  let domain: string;
  if (data.tenantId) {
    try {
      const tenant = await tenantService.getTenantById(data.tenantId);
      if (tenant?.primary_domain) {
        domain = tenant.primary_domain;
      } else {
        domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
      }
    } catch {
      domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
    }
  } else {
    domain = env.platform.sharedDomains[0] || 'watch.rekard.com';
  }
  
  // Ticket thumbnail - use provided thumbnail or hide the section
  const ticketThumbnailSection = data.ticketThumbnailUrl
    ? `<div style="text-align: center; margin-bottom: 28px;">
        <img src="${data.ticketThumbnailUrl}" alt="${ticketName}" style="max-width: 200px; height: auto; border-radius: 8px;">
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${ticketName} - Ticket confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 28px; color: #111827; font-weight: 600;">Your ticket is confirmed.</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              ${ticketThumbnailSection}
              
              <!-- Ticket Details Highlight -->
              <div style="text-align: center; margin-bottom: 28px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ticket</p>
                <p style="margin: 0 0 4px 0; font-size: 24px; color: #111827; font-weight: 700; line-height: 1.3;">${ticketName}</p>
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">${eventDateTimeRange}</p>
                ${data.expiresAt ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Access expires: ${formatDateTime(data.expiresAt)}</p>` : ''}
  </div>

              ${absoluteWatchLink ? `<!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${absoluteWatchLink}" style="display: inline-block; padding: 16px 48px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; min-width: 200px;">Watch</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Or copy this link:</p>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; word-break: break-all; font-size: 14px; color: #374151; margin-bottom: 40px;">
                ${absoluteWatchLink}
              </div>` : ''}
              
              <!-- Steps to Access -->
              ${absoluteWatchLink ? `<div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">Steps to Access</h2>
                <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px;">
                  <li style="margin-bottom: 12px;">Go to <strong>${absoluteWatchLink}</strong> on your browser (Chrome / Safari / Firefox / Opera).</li>
                  <li style="margin-bottom: 12px;">Login with OTP with <strong>${data.recipientEmail}</strong></li>
                </ol>
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">You can verify if you have access with the account under "My Purchases" on <strong>${domain}</strong></p>
              </div>` : ''}
              
              <!-- Please Note (adapted for livestream/VOD) -->
              <div style="border-left: 4px solid #fbbf24; background-color: #fffbeb; border-radius: 6px; padding: 20px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827; font-weight: 600;">Please Note</h2>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.7;">
                  <li style="margin-bottom: 8px;">This event is available for <strong>web-only viewing</strong> on any modern browser.</li>
                  <li style="margin-bottom: 8px;">All content is copyrighted and protected.</li>
                  <li style="margin-bottom: 0;">Sharing, recording, or distributing this content is strictly prohibited.</li>
                </ul>
  </div>

              <!-- Troubleshooting -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">Troubleshooting</h2>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">If you're having trouble accessing the event:</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  ${absoluteWatchLink ? `<li style="margin-bottom: 8px;">Please make sure you are on the link - <span style="color: #2563eb;">${absoluteWatchLink}</span></li>` : ''}
                  <li style="margin-bottom: 8px;">Make sure you have logged in with the same email address with which you made the purchase with or you have been given access to.</li>
                  <li style="margin-bottom: 8px;">For uninterrupted access / viewing experience, you will need at-least 3 MBPS download speed on your device. Kindly check your speeds at <a href="http://speedtest.net/" style="color: #2563eb;">speedtest.net</a> or <a href="http://testmy.net/" style="color: #2563eb;">testmy.net</a></li>
                  <li style="margin-bottom: 8px;">If you are facing any issues logging in or accessing the video, kindly clear the cookies / cache / history on your browser or try accessing on a different browser / device / network</li>
                  <li style="margin-bottom: 8px;">Based on your internet speed / connectivity you could choose to higher / lower the quality of the stream using the Gear icon on the video player. We suggest you reduce the quality of the stream if the internet is inconsistent or the video is buffering for you to have a continuous playback</li>
                  <li style="margin-bottom: 0;">For any help, reachout to support. Contact information available in the footer.</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                You received this email because you purchased or were granted access to an event.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
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
    const emailSubject = `${data.ticketTitle} - Ticket confirmation`;
    log.info(`[EMAIL] Sending purchase confirmation email - To: ${data.recipientEmail}, Subject: ${emailSubject}, Ticket: ${data.ticketTitle}`);

    // Build iCal attachment if event dates are available
    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (data.eventStartDatetime && data.eventEndDatetime) {
      try {
        const watchUrl = data.watchLink
          ? await makeAbsoluteWatchLink(data.watchLink, data.tenantId)
          : undefined;

        const icalContent = generateICalContent({
          title: data.eventTitle || data.ticketTitle,
          description: data.ticketDescription,
          startDatetime: data.eventStartDatetime,
          endDatetime: data.eventEndDatetime,
          url: watchUrl || undefined,
          uid: `rekard-order-${data.orderNumber}@rekard.app`,
        });

        attachments.push({
          filename: 'event.ics',
          content: Buffer.from(icalContent, 'utf-8'),
        });
      } catch (err) {
        log.warn(`[EMAIL] Failed to generate iCal attachment for order ${data.orderNumber}:`, err);
      }
    }

    const result = await client.emails.send({
      from: `${env.email.fromName} <${env.email.fromEmail}>`,
      to: [data.recipientEmail],
      subject: emailSubject,
      html: await generatePurchaseConfirmationHTML(data),
      attachments,
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
    const emailSubject = `${data.ticketTitle} - Ticket confirmation`;
    log.info(`[EMAIL] Sending access grant email - To: ${data.recipientEmail}, Subject: ${emailSubject}, Ticket: ${data.ticketTitle}`);

    // Build iCal attachment if event dates are available
    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (data.eventStartDatetime && data.eventEndDatetime) {
      try {
        const watchUrl = data.watchLink
          ? await makeAbsoluteWatchLink(data.watchLink, data.tenantId)
          : undefined;

        const icalContent = generateICalContent({
          title: data.eventTitle || data.ticketTitle,
          description: data.ticketDescription,
          startDatetime: data.eventStartDatetime,
          endDatetime: data.eventEndDatetime,
          url: watchUrl || undefined,
          uid: `rekard-access-${data.recipientEmail}-${Date.now()}@rekard.app`,
        });

        attachments.push({
          filename: 'event.ics',
          content: Buffer.from(icalContent, 'utf-8'),
        });
      } catch (err) {
        log.warn(`[EMAIL] Failed to generate iCal attachment for access grant to ${data.recipientEmail}:`, err);
      }
    }

    const result = await client.emails.send({
      from: `${env.email.fromName} <${env.email.fromEmail}>`,
      to: [data.recipientEmail],
      subject: emailSubject,
      html: await generateAccessGrantHTML(data),
      attachments,
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