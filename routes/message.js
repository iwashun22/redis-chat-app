'use strict';

const express = require('express');
const debug = require('debug')('app:send-message');
const router = express.Router();
const redisClient = require('../model/redis-loader');
const ensureAuthenticate = require('./ensure-authenticate');

router.post('/create', ensureAuthenticate, (req, res) => {
   const { message, roomId } = req.body;
   redisClient.hGet('all_users', req.user.id, async (err, name) => {
      if(err) throw err;
      const info = `[${message}] created by [${name}:${req.user.id}] in room [${roomId}]`;
      debug(info);
      await redisClient.get(`messages-count:${roomId}`, async (err, count) => {
         const int = parseInt(count);
         const messageObj = {
            id: int + 1,
            content: message,
            createdBy: req.user.id,
            createdAt: Date.now()
         }
         await redisClient.hSet(`messages:${roomId}`, int + 1, JSON.stringify(messageObj));
         await redisClient.set(`messages-count:${roomId}`, int + 1);
         res.json({ message: {
            ...messageObj,
            createdBy: name,
            roomId
         } });
      })
   })
})

module.exports = router;