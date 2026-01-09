const crypto = require('crypto');
console.log('Your new API Key:');
console.log(crypto.randomBytes(32).toString('hex'));