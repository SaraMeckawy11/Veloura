const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export function orderConfirmationEmail({ customerName, publicSlug, editToken, weddingDetails, isPending = false }) {
  const dashboardUrl = `${CLIENT_URL}/dashboard/${editToken}`;
  const editUrl = `${CLIENT_URL}/edit/${editToken}`;
  const invitationUrl = `${CLIENT_URL}/i/${publicSlug}`;

  const name1 = weddingDetails.groomName || '';
  const name2 = weddingDetails.brideName || '';
  const venue = weddingDetails.venue || '';
  const dateStr = weddingDetails.weddingDate
    ? new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const subject = isPending
    ? 'Eternally — Your invitation is ready!'
    : `${name1} & ${name2} — Invitation Live!`;

  const title = isPending ? 'Your invitation is ready!' : 'Your invitation is live!';
  const subtitle = isPending
    ? `Thank you, ${customerName}! We've received your details and your invitation is being prepared. Complete payment to share it with your guests.`
    : `Congratulations, ${customerName}! Your payment is confirmed. Here are your links.`;

  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #F7F5F2; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D2A26; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 16px; }
    .card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .card-body { padding: 36px 32px; }
    .logo { font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #2D2A26; letter-spacing: 1px; text-align: center; margin-bottom: 28px; }
    .logo span { color: #D4AF5A; }
    h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 400; text-align: center; margin: 0 0 12px; color: #2D2A26; }
    .subtitle { text-align: center; color: #7A756F; font-size: 14px; line-height: 1.7; margin: 0 0 28px; }
    .details-card { background: #FAFAF8; border: 1px solid #F0EDE8; border-radius: 14px; padding: 20px 24px; margin-bottom: 28px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F0EDE8; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #A09A93; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .detail-value { color: #2D2A26; font-weight: 500; text-align: right; }
    .btn-group { margin-bottom: 8px; }
    .btn { display: block; width: 100%; padding: 16px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; margin-bottom: 10px; box-sizing: border-box; }
    .btn-primary { background: linear-gradient(135deg, #D4AF5A 0%, #C49B3A 100%); color: #fff; }
    .btn-secondary { background: #fff; border: 1.5px solid #E8E4DF; color: #2D2A26; }
    .divider { height: 1px; background: #F0EDE8; margin: 24px 0; }
    .note { font-size: 13px; color: #A09A93; text-align: center; line-height: 1.7; }
    .note strong { color: #D4AF5A; }
    .footer { text-align: center; padding: 24px 16px; font-size: 11px; color: #B5B0AA; }
    .footer a { color: #D4AF5A; text-decoration: none; }
    @media (max-width: 480px) {
      .card-body { padding: 24px 20px; }
      h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="card-body">
        <div class="logo">Eternal<span>ly</span></div>

        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>

        <div class="details-card">
          ${name1 && name2 ? `<div class="detail-row"><span class="detail-label">Couple</span><span class="detail-value">${name1} & ${name2}</span></div>` : ''}
          ${dateStr ? `<div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${dateStr}</span></div>` : ''}
          ${venue ? `<div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${venue}</span></div>` : ''}
        </div>

        <div class="btn-group">
          ${!isPending ? `<a href="${invitationUrl}" class="btn btn-primary">View Your Invitation</a>` : ''}
          <a href="${dashboardUrl}" class="btn ${isPending ? 'btn-primary' : 'btn-secondary'}">Go to Dashboard</a>
          ${!isPending ? `<a href="${editUrl}" class="btn btn-secondary">Edit Your Invitation</a>` : ''}
        </div>

        <div class="divider"></div>

        <p class="note">
          ${isPending
            ? 'Complete your payment to activate your invitation and share it with guests.'
            : `You have <strong>5 free edits</strong> available. Simply click the edit link above to make changes.`
          }
        </p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} <a href="${CLIENT_URL}">Eternally</a> &middot; Beautiful wedding invitations
    </div>
  </div>
</body>
</html>`,
  };
}

export function rsvpNotificationEmail({ customerName, guestName, attending, guestCount, message }) {
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
      <div class="logo">Eternal<span>ly</span></div>
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

export function editLimitWarningEmail({ customerName, editsRemaining, editToken }) {
  const editUrl = `${CLIENT_URL}/edit/${editToken}`;

  return {
    subject: `Eternally: You have ${editsRemaining} edit${editsRemaining === 1 ? '' : 's'} remaining`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #F7F5F2; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D2A26; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E8E4DF; text-align: center; }
    .logo { font-family: Georgia, serif; font-size: 20px; color: #2D2A26; margin-bottom: 24px; }
    .logo span { color: #B8924A; }
    p { color: #6B6560; font-size: 15px; line-height: 1.7; }
    .count { font-family: Georgia, serif; font-size: 36px; color: #B8924A; font-weight: 700; }
    .btn { display: inline-block; padding: 12px 32px; background: #B8924A; color: #fff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Eternal<span>ly</span></div>
      <p>Hi ${customerName},</p>
      <div class="count">${editsRemaining}</div>
      <p>edit${editsRemaining === 1 ? '' : 's'} remaining on your invitation. Make them count!</p>
      <a href="${editUrl}" class="btn">Edit Invitation</a>
    </div>
  </div>
</body>
</html>`,
  };
}
