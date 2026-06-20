const MetaApi = require('metaapi.cloud-sdk').default;
const api = new MetaApi(process.env.METAAPI_TOKEN);

async function provisionAccount(userId, login, password, server, broker) {
  const account = await api.metatraderAccountApi.createAccount({
    name: `User-${userId}`,
    type: 'cloud',
    login, password, server,
    platform: 'mt5',
    application: 'MetaApi',
    broker
  });
  await account.deploy();
  await account.waitConnected();
  return account.id;
}

async function placeTrade(accountId, symbol, lot, sl, tp, direction) {
  const account = await api.metatraderAccountApi.getAccount(accountId);
  const connection = account.getStreamingConnection();
  await connection.connect();
  await connection.waitSynchronized();
  const order = await connection.createMarketBuyOrder(symbol, lot, sl, tp, {
    comment: 'ENLIGHT QConnect',
    type: direction === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL'
  });
  await connection.disconnect();
  return order;
}

module.exports = { provisionAccount, placeTrade };