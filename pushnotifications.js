const webpush = require('web-push');
webpush.setVapidDetails('mailto:your@email.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
module.exports = {
  sendPush: async (subscription, payload) => {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  }
};