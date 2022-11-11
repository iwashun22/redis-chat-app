const redis = require('redis');
const client = redis.createClient({
   legacyMode: true,
   url: 'redis://@db',
   password: 'redis1234'
});

(async () => {
   try {
      await client.connect();
   } catch(err) {
      console.log(err);
   }
})();

module.exports = client;