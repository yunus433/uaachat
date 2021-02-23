const express = require('express');
const router = express.Router();

const isLoggedIn = require('../middleware/isLoggedIn');

const loginGetController = require('../controllers/auth/login/get');
const registerGetController = require('../controllers/auth/register/get');
const confirmGetController = require('../controllers/auth/confirm/get');

const loginPostController = require('../controllers/auth/login/post');
const registerPostController = require('../controllers/auth/register/post');
const confirmPostController = require('../controllers/auth/confirm/post');

router.get(
  '/login',
    loginGetController
);
router.get(
  '/register',
    registerGetController
);
router.get(
  '/confirm',
    isLoggedIn,
    confirmGetController
);

router.post(
  '/login',
    loginPostController
);
router.post(
  '/register',
    registerPostController
);
router.post(
  '/confirm',
    isLoggedIn,
    confirmPostController
);

module.exports = router;
