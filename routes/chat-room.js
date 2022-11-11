'use strict';

const express = require('express');
const router = express.Router();
const redisClient = require('../model/redis-loader');
const debug = require('debug')('app:new-room')
const ensureAuthenticate = require('./ensure-authenticate');
const crypto = require('crypto');
const Cookies = require('cookies');

router.post('/new', ensureAuthenticate, async (req, res) => {
   const id = crypto.randomBytes(4).toString('hex');
   const { roomName } = req.body;
   if(!roomName) {
      res.redirect('/');
      return;
   }
   const data = {
      roomName: roomName,
      createdBy: req.user.id,
      bannedUsers: [],
      users: [req.user.id]
   }
   await redisClient.set(`room:${id}`, JSON.stringify(data));
   await redisClient.set(`messages-count:${id}`, 0);
   await redisClient.sAdd('rooms', `room:${id}`);
   debug(`[${id}] created by [${req.user.id}]`);
   res.redirect(`/chatroom/${id}`);
});

router.post('/join', (req, res) => {
   const { roomId } = req.body;
   res.redirect(`/chatroom/${roomId}`);
})

router.get('/:id', (req, res) => {
   const { id } = req.params;
   redisClient.get(`room:${id}`, (err, data) => {
      if(data == null) {
         res.redirect('/');
         return;
      }
      const json = JSON.parse(data);
      json.id = id;
      const cookies = new Cookies(req, res);
      cookies.set('last_access', Date.now());
      const halfDay = new Date(Date.now() + (1000 * 60 * 60 * 12));
      cookies.set('current_room', id, { expires:  halfDay });
      redisClient.hVals(`messages:${id}`, (err, messages) => {
         // console.log(messages);
         redisClient.hGetAll('all_users', (err, users) => {
            if(err) throw err;
            const usersMap = new Map();
            if(Array.isArray(users)) {
               users.forEach((value, index) => {
                  if(index % 2 == 0) {
                     usersMap.set(value, users[index + 1]);
                  }
               })
            }
            json.createdBy = usersMap.get(json.createdBy);
            let messagesArr = [];
            if(messages.length > 0) {
               messagesArr = messages.map(jsonString => {
                  const message = JSON.parse(jsonString);
                  const username = usersMap.get(message.createdBy);
                  // prevent error when user who hasn't login is watching
                  if(req.user) {
                     message.isCreatedByMe = message.createdBy === req.user.id;
                  }
                  message.createdBy =  username;
                  return message;
               })
               messagesArr = messagesArr.sort((mA, mB) => +mA.id - +mB.id);
            }
            const user = req.user ? 
               {
                  id: req.user.id,
                  name: usersMap.get(req.user.id)
               }
               : undefined;
            res.render('chat-room', { 
               messages: messagesArr, 
               room: json,
               user
            });
         })
      })
   })
});

router.get('/delete/:id', async (req, res) => {
   const { id } = req.params;
   await redisClient.del(`room:${id}`);
   await redisClient.del(`messages-count:${id}`);
   await redisClient.del(`messages:${id}`);
   await redisClient.sRem('rooms', `room:${id}`);
   res.redirect('/');
})

module.exports = router;