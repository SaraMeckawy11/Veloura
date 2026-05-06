import cron from 'cron';
import https from 'https';

const pingUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;

const job = new cron.CronJob('*/14 * * * *', () => {
  if (!pingUrl || pingUrl.includes('localhost')) return;

  https
    .get(`${pingUrl.replace(/\/$/, '')}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('Pinged successfully');
      } else {
        console.log('Failed to ping. Status Code: ', res.statusCode);
      }

      res.resume();
    })
    .on('error', (e) => {
      console.error(`Error pinging: ${e.message}`);
    });
});

export default job;
