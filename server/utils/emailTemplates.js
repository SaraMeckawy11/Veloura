import { getClientUrl } from '../config/urls.js';

const CLIENT_URL = getClientUrl();

export function orderConfirmationEmail({ customerName, publicSlug, editToken, weddingDetails, isPending = false, invitationCode }) {
  const dashboardUrl = `${CLIENT_URL}/dashboard/${editToken}`;
  const editUrl = `${CLIENT_URL}/edit/${editToken}`;
  const invitationUrl = `${CLIENT_URL}/i/${publicSlug}`;

  const name1 = weddingDetails.groomName || '';
  const name2 = weddingDetails.brideName || '';
  const coupleName = [name1, name2].filter(Boolean).join(' & ');
  const venue = weddingDetails.venue || '';
  const shareText = `You're invited to ${coupleName ? `${coupleName}'s` : 'our'} wedding! View the invitation here: ${invitationUrl}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const dateStr = weddingDetails.weddingDate
    ? new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const subject = isPending
    ? 'Veloura — Your invitation is ready!'
    : `${name1} & ${name2} — Invitation Live!`;

  const title = isPending ? 'Your invitation is ready!' : 'Your invitation is live!';
  const subtitle = isPending
    ? `Thank you, ${customerName}! We've received your details and your invitation is being prepared. Complete payment to share it with your guests.`
    : `Congratulations, ${customerName}! Your payment is confirmed. Here are your links.`;

  const details = [
    name1 && name2 ? ['Couple', `${name1} &amp; ${name2}`] : null,
    dateStr ? ['Date', dateStr] : null,
    venue ? ['Venue', venue] : null,
  ].filter(Boolean);

  const detailsTable = details
    .map(([label, value], i) => {
      const border = label === 'Venue' || i === details.length - 1 ? '' : 'border-bottom: 1px solid #F0EDE8;';
      return `
                <tr>
                  <td style="padding: 14px 16px 14px 0; ${border} font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; color: #A09A93; white-space: nowrap; vertical-align: middle;">${label}</td>
                  <td style="padding: 14px 0; ${border} font-size: 14px; font-weight: 500; color: #2D2A26; text-align: right; vertical-align: middle;">${value}</td>
                </tr>`;
    })
    .join('');

  // Email-safe button using a table so it renders consistently in Outlook/Gmail/Apple Mail.
  const button = (href, label, variant) => {
    const isPrimary = variant === 'primary';
    const bg = isPrimary ? '#C49B3A' : '#ffffff';
    const color = isPrimary ? '#ffffff' : '#2D2A26';
    const border = isPrimary ? '#C49B3A' : '#E8E4DF';
    return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                <tr>
                  <td align="center" bgcolor="${bg}" style="border-radius: 50px; border: 1.5px solid ${border};">
                    <a href="${href}" style="display: block; padding: 15px 16px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: ${color}; text-decoration: none; border-radius: 50px;">${label}</a>
                  </td>
                </tr>
              </table>`;
  };

  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="margin: 0; padding: 0; background: #F7F5F2; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F7F5F2;">
    <tr>
      <td align="center" style="padding: 40px 16px; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background: #ffffff; border-radius: 20px; padding: 36px 32px;">

              <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #2D2A26; letter-spacing: 1px; text-align: center; padding-bottom: 28px;">Velou<span style="color: #D4AF5A;">ra</span></div>

              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 400; text-align: center; margin: 0 0 12px; color: #2D2A26;">${title}</h1>
              <p style="text-align: center; color: #7A756F; font-size: 14px; line-height: 1.7; margin: 0 0 28px;">${subtitle}</p>

              ${detailsTable ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAF8; border: 1px solid #F0EDE8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 8px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${detailsTable}
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${invitationCode ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F7F5F2; border-radius: 10px; margin-bottom: 28px;">
                <tr>
                  <td align="center" style="padding: 16px 20px; border: 1.5px dashed #D4AF5A; border-radius: 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #A09A93; font-weight: 600; padding-bottom: 6px;">Your Invitation Code</div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #C49B3A; letter-spacing: 2px;">${invitationCode}</div>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${!isPending ? button(invitationUrl, 'View Your Invitation', 'primary') : ''}
              ${!isPending ? button(shareUrl, 'Share Invitation', 'secondary') : ''}
              ${button(dashboardUrl, 'Go to Dashboard', isPending ? 'primary' : 'secondary')}
              ${!isPending ? button(editUrl, 'Edit Your Invitation', 'secondary') : ''}

              <div style="height: 1px; background: #F0EDE8; margin: 24px 0;"></div>

              <p style="font-size: 12px; color: #A09A93; text-align: center; line-height: 1.65; margin: 0;">
                ${isPending
                  ? 'Complete your payment to activate your invitation.'
                  : `You can update your invitation whenever you'd like — just tap the edit link above.<br><br>Lost the link later? Come back to <a href="${CLIENT_URL}/my-invitation" style="color: #D4AF5A; text-decoration: none; font-weight: 600;">My Invitation</a> and enter your invitation code above. Keep this code private.`
                }
              </p>

            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 16px; font-size: 11px; color: #B5B0AA;">
              &copy; ${new Date().getFullYear()} <a href="${CLIENT_URL}" style="color: #D4AF5A; text-decoration: none;">Veloura</a> &middot; Beautiful wedding invitations
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

export function rsvpNotificationEmail({ guestName, attending, guestCount, message }) {
  return {
    subject: `New RSVP: ${guestName} ${attending === 'yes' ? 'is attending' : attending === 'no' ? 'can\'t make it' : 'replied maybe'}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #F7F5F2; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D2A26; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E8E4DF; }
    .logo { font-family: Georgia, serif; font-size: 20px; color: #2D2A26; margin-bottom: 24px; }
    .logo span { color: #B8924A; }
    h2 { font-family: Georgia, serif; font-size: 18px; font-weight: 400; margin: 0 0 16px; }
    .status { display: inline-block; padding: 4px 14px; border-radius: 50px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .status-yes { background: #EFF5ED; color: #7E9B76; }
    .status-no { background: #FCEEF0; color: #C4727F; }
    .status-maybe { background: #F0E6D3; color: #B8924A; }
    .detail { font-size: 14px; color: #6B6560; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Velou<span>ra</span></div>
      <h2>New RSVP from ${guestName}</h2>
      <span class="status status-${attending}">${attending === 'yes' ? 'Attending' : attending === 'no' ? 'Not Attending' : 'Maybe'}</span>
      <div class="detail">
        <p><strong>Guest count:</strong> ${guestCount}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}

export function sensitiveFieldChangeEmail({ customerName, changedFields, nameEditsRemaining, dateEditsRemaining, editToken }) {
  const editUrl = `${CLIENT_URL}/edit/${editToken}`;
  const fieldList = changedFields.join(', ');
  const warnings = [];
  if (nameEditsRemaining !== undefined && nameEditsRemaining <= 0) {
    warnings.push('Couple names are now permanently locked and cannot be changed again.');
  }
  if (dateEditsRemaining !== undefined) {
    warnings.push(`You have ${dateEditsRemaining} wedding date change${dateEditsRemaining === 1 ? '' : 's'} remaining.`);
  }

  return {
    subject: `Veloura: Important changes made to your invitation`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #F7F5F2; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D2A26; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E8E4DF; }
    .logo { font-family: Georgia, serif; font-size: 20px; color: #2D2A26; margin-bottom: 24px; }
    .logo span { color: #B8924A; }
    h2 { font-family: Georgia, serif; font-size: 18px; font-weight: 400; margin: 0 0 16px; }
    p { color: #6B6560; font-size: 14px; line-height: 1.7; }
    .changed { background: #FFF8E8; border: 1px solid #F0DDA8; border-radius: 10px; padding: 14px 18px; margin: 16px 0; font-size: 14px; color: #8B7030; }
    .warning { background: #FFF3F0; border: 1px solid #F5D0C8; border-radius: 10px; padding: 14px 18px; margin: 12px 0; font-size: 13px; color: #A0503A; }
    .btn { display: inline-block; padding: 12px 32px; background: #B8924A; color: #fff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .note { font-size: 12px; color: #A09A93; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Velou<span>ra</span></div>
      <h2>Changes detected on your invitation</h2>
      <p>Hi ${customerName},</p>
      <p>The following sensitive fields were just updated on your wedding invitation:</p>
      <div class="changed"><strong>Changed:</strong> ${fieldList}</div>
      ${warnings.map(w => `<div class="warning">${w}</div>`).join('')}
      <p>If you did not make these changes, please review your invitation immediately.</p>
      <a href="${editUrl}" class="btn">Review Invitation</a>
      <p class="note">This notification was sent because important details on your invitation were changed. If you made these changes, no action is needed.</p>
    </div>
  </div>
</body>
</html>`,
  };
}
