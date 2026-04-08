const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export function orderConfirmationEmail({ customerName, publicSlug, editToken, weddingDetails }) {
  const editUrl = `${CLIENT_URL}/edit/${editToken}`;
  const invitationUrl = `${CLIENT_URL}/i/${publicSlug}`;

  return {
    subject: 'Your Eternally invitation is ready!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #F7F5F2; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D2A26; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #fff; border-radius: 16px; padding: 40px 32px; border: 1px solid #E8E4DF; }
    .logo { font-family: Georgia, serif; font-size: 24px; color: #2D2A26; text-align: center; margin-bottom: 32px; }
    .logo span { color: #B8924A; }
    h1 { font-family: Georgia, serif; font-size: 22px; font-weight: 400; text-align: center; margin: 0 0 8px; }
    .subtitle { text-align: center; color: #6B6560; font-size: 15px; margin-bottom: 32px; }
    .details { background: #F7F5F2; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .details-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .details-row .label { color: #9B9590; }
    .btn { display: block; width: 100%; padding: 14px; background: #B8924A; color: #fff; text-align: center; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; margin-bottom: 12px; }
    .btn-outline { background: transparent; border: 1px solid #E8E4DF; color: #2D2A26; }
    .note { font-size: 13px; color: #9B9590; text-align: center; margin-top: 24px; line-height: 1.6; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #9B9590; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Eternal<span>ly</span></div>
      <h1>Your invitation is live!</h1>
      <p class="subtitle">Congratulations, ${customerName}! Here are your links.</p>

      <div class="details">
        ${weddingDetails.groomName && weddingDetails.brideName ? `<div class="details-row"><span class="label">Couple</span><span>${weddingDetails.groomName} & ${weddingDetails.brideName}</span></div>` : ''}
        ${weddingDetails.weddingDate ? `<div class="details-row"><span class="label">Date</span><span>${new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>` : ''}
        ${weddingDetails.venue ? `<div class="details-row"><span class="label">Venue</span><span>${weddingDetails.venue}</span></div>` : ''}
      </div>

      <a href="${invitationUrl}" class="btn">View Your Invitation</a>
      <a href="${editUrl}" class="btn btn-outline">Edit Your Invitation</a>

      <p class="note">
        You have <strong>5 free edits</strong> available. Simply click the edit link above to make changes.<br>
        Your invitation will stay live for <strong>1 full year</strong>.
      </p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} Eternally. All rights reserved.</div>
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
