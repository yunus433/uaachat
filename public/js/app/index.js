let limit = 100, skip = 0, is_finished = false;
let message_limit = 100, message_skip = 0, message_is_finished = false;
let socket = null, user, chat_id, is_first_chat;
let last_message = null;

function pushChatToWrapper (chat, wrapper) {
  // Push a new DOM document to the wrapper

  const eachChangeChatWrapper = document.createElement('div');
  eachChangeChatWrapper.classList.add('each-change-chat-wrapper');
  eachChangeChatWrapper.id = chat._id;
  if (chat._id == chat_id)
    eachChangeChatWrapper.classList.add('selected-chat');

  const eachChangeChatProfilePhoto = document.createElement('div');
  eachChangeChatProfilePhoto.classList.add('each-change-chat-profile-photo');
  const img = document.createElement('img');
  img.src = chat.profile_photo;
  img.alt = `uaachat ${chat.name}`;
  eachChangeChatProfilePhoto.appendChild(img);
  eachChangeChatWrapper.appendChild(eachChangeChatProfilePhoto);

  const chatInfoWrapper = document.createElement('div');
  chatInfoWrapper.classList.add('chat-info-wrapper');

  const eachChatInfoTitleWrapper = document.createElement('div');
  eachChatInfoTitleWrapper.classList.add('each-chat-info-title-wrapper');
  const eachChatName = document.createElement('span');
  eachChatName.classList.add('each-chat-name');
  eachChatName.innerHTML = chat.name;
  eachChatInfoTitleWrapper.appendChild(eachChatName);
  chatInfoWrapper.appendChild(eachChatInfoTitleWrapper);

  const eachChatLastMessage = document.createElement('span');
  eachChatLastMessage.classList.add('each-chat-last-message');
  const span = document.createElement('span');
  span.innerHTML = chat.email.split('@')[0];
  eachChatLastMessage.appendChild(span);
  chatInfoWrapper.appendChild(eachChatLastMessage);

  eachChangeChatWrapper.appendChild(chatInfoWrapper);

  wrapper.appendChild(eachChangeChatWrapper);
}

function reUploadContacts (chats) {
  // Recreate the content of the contacts-wrapper

  document.getElementById('contacts-wrapper').innerHTML = '';

  if (!chats) {
    serverRequest(`/app/contacts?limit=${limit}&skip=0`, 'GET', {}, response => {
      if (!response.success)
        return alert(`An error occured, please try again later. Error Message: ${response.error}`);
  
      response.contacts.forEach(contact => {
        pushChatToWrapper(contact, document.getElementById('contacts-wrapper'));
      });
  
      skip += response.contacts.length;
  
      if (!response.contacts.length)
        is_finished = true;
    });
  } else {
    chats.forEach(chat => {
      pushChatToWrapper(chat, document.getElementById('contacts-wrapper'));
    });

    skip += chats.length;
  }
}

function reUploadChats (chats) {
  // Recreate the content of the recent-chats-wrapper

  document.getElementById('recent-chats-wrapper').innerHTML = '';

  if (!chats) {
    serverRequest(`/app/chats?limit=${limit}&skip=0`, 'GET', {}, response => {
      if (!response.success)
        return alert(`An error occured, please try again later. Error Message: ${response.error}`);
  
      response.chats.forEach(chat => {
        pushChatToWrapper(chat, document.getElementById('recent-chats-wrapper'));
      });
  
      skip += response.chats.length;
    });
  } else {
    chats.forEach(chat => {
      pushChatToWrapper(chat, document.getElementById('recent-chats-wrapper'));
    });

    skip += chats.length;
  }
}

function createMessage (message) {
  // Create and push a new message to the chat-messages-wrapper
  // Take the messageBefore to create the day of the message

  const wrapper = document.querySelector('.chat-messages-wrapper');

  if (!last_message || last_message.day != message.day) {
    const messageDay = document.createElement('span');
    messageDay.classList.add('message-day');
    messageDay.innerHTML = (message.days_ago == 0 ? 'Today' : (message.days_ago == 1 ? 'Yesterday' : message.day));
    wrapper.appendChild(messageDay);
  }

  if (message.sender_id == user._id) {
    const eachUserMessage = document.createElement('span');
    eachUserMessage.classList.add('each-user-message');
    if (!last_message || last_message.sender_id != message.sender_id)
      eachUserMessage.classList.add('each-new-user-message');
    
    const eachUserMessageContent = document.createElement('span');
    eachUserMessageContent.classList.add('each-user-message-content');
    eachUserMessageContent.innerHTML = message.content;
    eachUserMessage.appendChild(eachUserMessageContent);

    const eachUserMessageTime = document.createElement('span');
    eachUserMessageTime.classList.add('each-user-message-time');
    eachUserMessageTime.innerHTML = message.time;
    eachUserMessage.appendChild(eachUserMessageTime);

    wrapper.appendChild(eachUserMessage);

    if (eachUserMessageContent.offsetWidth + eachUserMessageTime.offsetWidth < 290)
      eachUserMessageTime.style.marginTop = '-10px';
  } else {
    const eachMessage = document.createElement('span');
    eachMessage.classList.add('each-message');
    if (!last_message || last_message.sender_id != message.sender_id)
      eachMessage.classList.add('each-new-message');
    
    const eachMessageContent = document.createElement('span');
    eachMessageContent.classList.add('each-message-content');
    eachMessageContent.innerHTML = message.content;
    eachMessage.appendChild(eachMessageContent);

    const eachMessageTime = document.createElement('span');
    eachMessageTime.classList.add('each-message-time');
    eachMessageTime.innerHTML = message.time;
    eachMessage.appendChild(eachMessageTime);

    wrapper.appendChild(eachMessage);

    if (eachMessageContent.offsetWidth + eachMessageTime.offsetWidth < 290)
      eachMessageTime.style.marginTop = '-10px';
  }

  last_message = message;
  setTimeout(() => {
    wrapper.scrollTop = wrapper.scrollHeight;
  }, 15);
}

function createChatWrapperContent () {
  // Creates the content of the chat wrapper using chat_id
  
  const chatWrapper = document.querySelector('.chat-wrapper');
  chatWrapper.innerHTML = '';
  if (document.querySelector('.selected-chat'))
    document.querySelector('.selected-chat').classList.remove('selected-chat');
  document.getElementById(chat_id).classList.add('selected-chat');

  serverRequest(`/app/messages?chat_id=${chat_id}&limit=${message_limit}&timezone=${(new Date()).getTimezoneOffset()}`, 'GET', {}, response => {
    if (!response.success)
      return alert(`An error occured, please try again later. Error Message: ${response.error}`);

    is_first_chat = response.messages.length ? false : true;
    message_skip += response.messages.length;

    if (!response.messages.length)
      message_is_finished = true;

    const chatProfileWrapper = document.createElement('div');
    chatProfileWrapper.classList.add('chat-profile-wrapper');

    const chatGoBackButton = document.createElement('i');
    chatGoBackButton.classList.add('fas');
    chatGoBackButton.classList.add('fa-chevron-left');
    chatGoBackButton.classList.add('chat-go-back-button');
    chatProfileWrapper.appendChild(chatGoBackButton);

    const chatProfilePhoto = document.createElement('div');
    chatProfilePhoto.classList.add('chat-profile-photo');
    const img = document.createElement('img');
    img.src = document.getElementById(chat_id).childNodes[0].childNodes[0].src;
    img.alt = document.getElementById(chat_id).childNodes[0].childNodes[0].alt;
    chatProfilePhoto.appendChild(img);
    chatProfileWrapper.appendChild(chatProfilePhoto);

    const chatInfoWrapper = document.createElement('div');
    chatInfoWrapper.classList.add('chat-info-wrapper');

    const chatName = document.createElement('span');
    chatName.classList.add('chat-name');
    chatName.innerHTML = document.getElementById(chat_id).childNodes[1].childNodes[0].childNodes[0].innerHTML;
    chatInfoWrapper.appendChild(chatName);

    const chatEmail = document.createElement('span');
    chatEmail.classList.add('chat-email');
    chatEmail.innerHTML = document.getElementById(chat_id).childNodes[1].childNodes[1].childNodes[0].innerHTML;
    chatInfoWrapper.appendChild(chatEmail);

    chatProfileWrapper.appendChild(chatInfoWrapper);

    chatWrapper.appendChild(chatProfileWrapper);

    const chatMessagesWrapper = document.createElement('div');
    chatMessagesWrapper.classList.add('chat-messages-wrapper');

    chatWrapper.appendChild(chatMessagesWrapper);

    last_message = null;
    for (let i = 0; i < response.messages.length; i++)
      createMessage(response.messages[i]);

    const chatInputWrapper = document.createElement('div');
    chatInputWrapper.classList.add('chat-input-wrapper');

    const chatInput = document.createElement('input');
    chatInput.classList.add('chat-input');
    chatInput.type = 'text';
    chatInput.placeholder = response.messages.length ? 'Write your message' : 'Write your message to start the chat!';
    chatInputWrapper.appendChild(chatInput);

    chatWrapper.appendChild(chatInputWrapper);
  });
}

function searchChats (name, callback) {
  serverRequest('/app/chats' + (name && name.length ? '?name=' + name : ''), 'GET', {}, res => {
    if (!res.success)
      return callback(res.error);
      
    return callback(null, res.chats);
  });
};

function searchContacts (name, callback) {
  serverRequest('/app/contacts' + (name && name.length ? '?name=' + name : ''), 'GET', {}, res => {
    if (!res.success)
      return callback(res.error);
      
    return callback(null, res.contacts);
  });
};

window.onload = () => {
  reUploadChats();
  reUploadContacts();

  user = JSON.parse(document.getElementById('user-object').value);
  socket = io();

  socket.on('connect', function () {
    socket.emit('join', {
      room: user._id
    });
  });

  document.addEventListener('click', event => {
    if (event.target.classList.contains('each-change-chat-wrapper') || (event.target.parentNode && event.target.parentNode.classList.contains('each-change-chat-wrapper')) || (event.target.parentNode.parentNode && event.target.parentNode.parentNode.classList.contains('each-change-chat-wrapper')) || (event.target.parentNode.parentNode.parentNode && event.target.parentNode.parentNode.parentNode.classList.contains('each-change-chat-wrapper'))) {
      if (event.target.classList.contains('each-change-chat-wrapper')) {
        chat_id = event.target.id;
      } else if (event.target.parentNode.classList.contains('each-change-chat-wrapper')) {
        chat_id = event.target.parentNode.id;
      } else if (event.target.parentNode.parentNode.classList.contains('each-change-chat-wrapper')) {
        chat_id = event.target.parentNode.parentNode.id;
      } else if (event.target.parentNode.parentNode.parentNode.classList.contains('each-change-chat-wrapper')) {
        chat_id = event.target.parentNode.parentNode.parentNode.id;
      }

      document.querySelector('.menu-wrapper').style.zIndex = 1;
      createChatWrapperContent();
    }

    if (event.target.classList.contains('chat-go-back-button')) {
      document.querySelector('.menu-wrapper').style.zIndex = 3;
    }
  });

  document.addEventListener('keydown', event => {
    if (socket && event.key == 'Enter' && event.target.classList.contains('chat-input') && event.target.value.trim().length) {
      if (is_first_chat) {
        serverRequest(`/app/send_message`, 'POST', {
          type: 'text',
          content: event.target.value.trim(),
          sender_id: user._id,
          users: [
            user._id,
            chat_id // As this is the first chat, chat_id keeps the user_id of the new user. Change this on group chat!!
          ]
        }, response => {
          if (!response.success)
            return alert("An unknown error occured. Error message: " + response.error);

          serverRequest(`/app/message?_id=${response.message_id}&timezone=${(new Date).getTimezoneOffset()}`, 'GET', {}, response => {
            if (!response.success)
              return alert("An unknown error occured. Error message: " + response.error);

            socket.emit('send_first_message', {
              message_id: response.message_id
            }, err => {
              if (err) return alert(err);
              event.target.value = '';
              reUploadChats();
              reUploadContacts();
              createMessage(response.message);
            });
          });
        });
      } else {
        serverRequest(`/app/send_message`, 'POST', {
          type: 'text',
          content: event.target.value.trim(),
          sender_id: user._id,
          chat_id
        }, response => {
          if (!response.success)
            return alert("An unknown error occured. Error message: " + response.error);

          serverRequest(`/app/message?_id=${response.message_id}&timezone=${(new Date).getTimezoneOffset()}`, 'GET', {}, response => {
            if (!response.success)
              return alert("An unknown error occured. Error message: " + response.error);

            socket.emit('send_message', {
              message_id: response.message_id
            }, err => {
              if (err) return alert(err);
              event.target.value = '';
              reUploadChats();
              createMessage(response.message);
            });
          });
        });
      }
    }

    if (event.key == 'Enter' && event.target.classList.contains('search-chat-input')) {
      searchChats(event.target.value, (err, chats) => {
        if (err)
          return alert(`An error occured, please try again later. Error Message: ` + err);
  
        reUploadChats(chats);
  
        searchContacts(event.target.value, (err, contacts) => {
          if (err)
            return alert(`An error occured, please try again later. Error Message: ` + err);
  
          return reUploadContacts(contacts);
        });
      });
    }
  });
}

window.onbeforeunload = () => {
  if (socket)
    socket.emit('leave', {
      room: user._id
    });
}
