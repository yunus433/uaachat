const express = require('express');
const router = express.Router();

const isConfirmed = require('../middleware/isConfirmed');
const isLoggedIn = require('../middleware/isLoggedIn');

const chatGetController = require('../controllers/app/chat/get');
const chatsGetController = require('../controllers/app/chats/get');
const contactsGetController = require('../controllers/app/contacts/get');
const indexGetController = require('../controllers/app/index/get');
const messageGetController = require('../controllers/app/message/get');
const messagesGetController = require('../controllers/app/messages/get');

const sendMessagePostController = require('../controllers/app/send_message/post');

router.get(
  '/',
    isLoggedIn,
    isConfirmed,
    indexGetController
);
router.get(
  '/chat',
    isLoggedIn,
    isConfirmed,
    chatGetController
);
router.get(
  '/chats',
    isLoggedIn,
    isConfirmed,
    chatsGetController
);
router.get(
  '/contacts',
    isLoggedIn,
    isConfirmed,
    contactsGetController
);
router.get(
  '/message',
    isLoggedIn,
    isConfirmed,
    messageGetController
);
router.get(
  '/messages',
    isLoggedIn,
    isConfirmed,
    messagesGetController
);

router.post(
  '/send_message',
    isLoggedIn,
    isConfirmed,
    sendMessagePostController
);

module.exports = router;
