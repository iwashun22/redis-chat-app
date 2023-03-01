const express = require('express');
const router = express.Router();
const cookie = require('cookie');
const redisClient = require('../model/redis-loader');

router.get('/', (req, res) => {
   // console.log(req.headers.cookie)
   const cookies = cookie.parse(req.headers.cookie || '');
   let currentRoom = cookies['current_room'] || '';
   // console.log(currentRoom)
   redisClient.get(`room:${currentRoom}`, async (err, data) => {
      if(data == null) currentRoom = '';
      if(req.user) {
         const createdRooms = await getRoomsUserCreated(req, res);
         redisClient.hGet('all_users', req.user.id, (err, name) => {
            if(err) throw err;
            res.render('index', { user: { name }, currentRoom, createdRooms });
         })
         return;
      }
      res.render('index', { user: null, currentRoom });
   })
})

function getRoomsUserCreated(req, res) {
   return new Promise((resolve, reject) => {
      redisClient.sMembers('rooms', (err, roomsArr) => {
         if(err) throw err;
         if(roomsArr == null) return resolve();
         if(roomsArr.length > 0) {
            let rooms = [];
            roomsArr.forEach((roomId, index) => {
               redisClient.get(roomId, (err, jsonString) => {
                  const room = JSON.parse(jsonString);
                  if(room.createdBy === req.user.id) {
                     const id = roomId.split(":")[1];
                     room.id = id;
                     rooms.push(room);
                  }
                  if(index === roomsArr.length - 1) rooms.length === 0 ? resolve() : resolve(rooms);
               })
            })
         }
         else resolve();
      });
   })
}

module.exports = router;