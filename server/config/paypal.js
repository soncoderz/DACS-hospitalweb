const paypal = require('paypal-rest-sdk');

// Chuyển đổi VND sang USD - Tỷ giá cố định
const VND_TO_USD_RATE = 24000;

// PayPal Configuration
paypal.configure({
  'mode': process.env.PAYPAL_MODE || 'sandbox', // sandbox hoặc live
  'client_id': process.env.PAYPAL_CLIENT_ID || 'Aetwa0pQjsQVVGxb_NqE5wue5IKBePqpHlGsLwSQ1mmr6uGMGPqs6MtrK-La4SCaRkS0Q0j1Ep-dwkkd',
  'client_secret': process.env.PAYPAL_CLIENT_SECRET || 'EBpCJvXYk46QVIKqWYnIzqIKcevWdG-ypXVkl1MkZq-W1ezevcveR-uPIZPQBGV4Q3p9STpRqO7QY9iZ'
});

// Hàm chuyển đổi VND sang USD
const convertVndToUsd = (vndAmount) => {
  // Đảm bảo số tiền USD tối thiểu là 0.01
  return Math.max((vndAmount / VND_TO_USD_RATE), 0.01).toFixed(2);
};

module.exports = {
  paypal,
  convertVndToUsd
}; 