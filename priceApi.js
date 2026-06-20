const axios = require('axios');
module.exports = {
  getCurrentPrice: async (symbol) => {
    try {
      const res = await axios.get(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`);
      return parseFloat(res.data.price);
    } catch (e) { return null; }
  }
};