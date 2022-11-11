'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   if(req.user) {
      res.redirect('/');
      return;
   }
   res.render('login', { hideLogin: true });
})

module.exports = router;