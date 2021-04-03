let limit = 100, skip = 0; // Limit and skip for contacts
let user = null, chat_id = null, global_chat = null, is_first_chat;
let last_message = null, focused = true;

function giveError (error) {
  console.log(error);
  // if (error && typeof error == 'string')
  //   alert("An error occured. Error Message: " + error);
  // else
  //   alert("An unknown error occured :(");
};

function sendNotification (title, data, callback) {
  return;
  if (!('Notification' in window))
    return;

  if (Notification.permission == 'granted') {
    const notification = new Notification(title, data);

    notification.onclick = () => {
      if (!focused)
        window.focus();
      notification.close();
      if (callback)
        callback(true);
    }

    setTimeout(() => {
      notification.close();
    }, 1000);
  } else if (Notification.permission != 'denied') {
    Notification.requestPermission().then(function (permission) {
      if (permission == 'granted')
        sendNotification(title, body);
    });
  }
};

function getMessage (id, callback) {
  serverRequest(`/app/message?_id=${id}&timezone=${(new Date()).getTimezoneOffset()}`, 'GET', {}, res => {
    if (!res.success)
      return callback(res.error || true);

    return callback(null, res.message);
  })
}

function updateNotReadMessages () {
  const notReadMessages = document.querySelectorAll('.not-read-message-icon');

  for (let i = 0; i < notReadMessages.length; i++) {
    const notReadMessage = notReadMessages[i].parentNode.parentNode.parentNode;
    getMessage(notReadMessage.id, (err, message) => {
      if (err) return giveError(err);

      if (message.read_by.length)
        notReadMessages[i].classList.remove('not-read-message-icon');
    });
  };
};

function checkEarliestNotReadMessage () {
  const earliestNotReadMessage = document.querySelector('.not-read-message-icon');

  if (!earliestNotReadMessage)
    return setTimeout(() => {
      checkEarliestNotReadMessage();
    }, 1000);

  const notReadMessage = earliestNotReadMessage.parentNode.parentNode.parentNode;
  getMessage(notReadMessage.id, (err, message) => {
    if (err) return giveError(err);

    if (message.read_by.length)
      updateNotReadMessages();

    setTimeout(() => {
      checkEarliestNotReadMessage();
    }, 1000);
  });
};

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
    eachUserMessage.id = message._id;
    if (!last_message || last_message.sender_id != message.sender_id || last_message.day != message.day)
      eachUserMessage.classList.add('each-new-user-message');
    
    const eachUserMessageContent = document.createElement('span');
    eachUserMessageContent.classList.add('each-user-message-content');
    eachUserMessageContent.innerHTML = message.content;
    eachUserMessage.appendChild(eachUserMessageContent);

    const eachUserMessageTime = document.createElement('div');
    eachUserMessageTime.classList.add('each-user-message-time');

    const eachUserMessageTimeSpan = document.createElement('span');
    eachUserMessageTimeSpan.innerHTML = message.time;
    eachUserMessageTime.appendChild(eachUserMessageTimeSpan);

    const eachUserMessageTimeIcons = document.createElement('div');
    eachUserMessageTimeIcons.classList.add('each-user-message-time-icons')
    const eachUserMessageTimeIcons1 = document.createElement('i');
    eachUserMessageTimeIcons1.classList.add('fas');
    eachUserMessageTimeIcons1.classList.add('fa-check');
    eachUserMessageTimeIcons.appendChild(eachUserMessageTimeIcons1);
    const eachUserMessageTimeIcons2 = document.createElement('i');
    eachUserMessageTimeIcons2.classList.add('fas');
    eachUserMessageTimeIcons2.classList.add('fa-check');
    eachUserMessageTimeIcons.appendChild(eachUserMessageTimeIcons2);
    if (!message.read_by.length) {
      eachUserMessageTimeIcons1.classList.add('not-read-message-icon');
      eachUserMessageTimeIcons2.classList.add('not-read-message-icon');
    }
    eachUserMessageTime.appendChild(eachUserMessageTimeIcons);
    
    eachUserMessage.appendChild(eachUserMessageTime);

    wrapper.appendChild(eachUserMessage);

    if (eachUserMessage.offsetWidth < eachUserMessage.parentNode.offsetWidth * 0.5 - 40) {
      eachUserMessageTime.style.marginTop = '-15px';
      eachUserMessageContent.style.marginRight = (eachUserMessageTime.offsetWidth + 10) + 'px';
    }
  } else {
    const eachMessage = document.createElement('span');
    eachMessage.classList.add('each-message');
    eachMessage.id = message._id;
    if (!last_message || last_message.sender_id != message.sender_id || last_message.day != message.day)
      eachMessage.classList.add('each-new-message');
    
    const eachMessageContent = document.createElement('span');
    eachMessageContent.classList.add('each-message-content');
    eachMessageContent.innerHTML = message.content;
    eachMessage.appendChild(eachMessageContent);

    const eachMessageTime = document.createElement('div');
    eachMessageTime.classList.add('each-message-time');

    const eachMessageTimeSpan = document.createElement('span');
    eachMessageTimeSpan.innerHTML = message.time;
    eachMessageTime.appendChild(eachMessageTimeSpan);

    eachMessage.appendChild(eachMessageTime);

    wrapper.appendChild(eachMessage);

    if (eachMessage.offsetWidth < eachMessage.parentNode.offsetWidth * 0.5 - 40) {
      eachMessageTime.style.marginTop = '-15px';
      eachMessageContent.style.marginRight = (eachMessageTime.offsetWidth + 10) + 'px';
    };
  }

  last_message = message;
  setTimeout(() => {
    wrapper.scrollTop = wrapper.scrollHeight;
  }, 15);
};

function uploadLatestMessages (callback) {
  serverRequest(`/app/messages?chat_id=${chat_id}&timezone=${(new Date()).getTimezoneOffset()}&earliest_id=${last_message._id.toString()}`, 'GET', {}, response => {
    if (!response.success)
      callback(response.error);

    for (let i = 0; i < response.messages.length; i++)
      createMessage(response.messages[i]);

    if (!focused)
      sendNotification(global_chat.name, {
        body: response.messages[response.messages.length-1],
        icon: global_chat.profile_photo
      });
    
    callback(null);
  });
};

function getChats (callback) {
  // Upload all chats, without any filter or option

  serverRequest(`/app/chats?timezone=${(new Date()).getTimezoneOffset()}`, 'GET', {}, response => {
    if (!response.success)
      return callback(response.error || true);

    callback(null, response.chats);
  });
};

function getContacts (callback) {
  // Upload recent contacts using global limit and skip options

  serverRequest(`/app/contacts?limit=${limit}&skip=${skip}&timezone=${(new Date()).getTimezoneOffset()}`, 'GET', {}, response => {
    if (!response.success)
      return callback(response.error || true);

    skip++;

    callback(null, response.contacts);
  });
};

function listenForTheChatMessages () {
  if (chat_id && last_message)
    uploadLatestMessages(err => {
      if (err) return giveError(err);

      setTimeout(() => {
        listenForTheChatMessages()
      }, 10);
    });
  else
    setTimeout(() => {
      listenForTheChatMessages()
    }, 1000);
};

function listenForChats () {
  getChats((err, chats) => {
    if (err) return console.log(err);

    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];

      let eachChangeChatWrapper = document.getElementById(chat._id.toString());
      if (eachChangeChatWrapper && chat._id.toString() == chat_id)
        eachChangeChatWrapper.classList.add('selected-chat');

      if (eachChangeChatWrapper) {  
        const eachChangeChatProfilePhoto = eachChangeChatWrapper.childNodes[0];
        eachChangeChatProfilePhoto.childNodes[0].src = chat.profile_photo;
        eachChangeChatProfilePhoto.childNodes[0].alt = `uaachat ${chat.name}`;
  
        const chatInfoWrapper = eachChangeChatWrapper.childNodes[1];
  
        const eachChatInfoTitleWrapper = chatInfoWrapper.childNodes[0];
        eachChatInfoTitleWrapper.childNodes[0].innerHTML = chat.name;
        eachChatInfoTitleWrapper.childNodes[1].innerHTML = chat.last_message.time;
  
        const eachChatLastMessage = chatInfoWrapper.childNodes[1];
        eachChatLastMessage.childNodes[0].innerHTML = chat.last_message.content;
        if (chat.not_read_message_number && (!eachChatLastMessage.childNodes[1] || chat.not_read_message_number > parseInt(eachChatLastMessage.childNodes[1].innerHTML)) && chat_id != chat._id.toString())
          sendNotification(chat.name, {
            body: chat.last_message.content + ' - ' + chat.last_message.time,
            icon: chat.profile_photo
          }, clicked => {
            if (clicked) {
              chat_id = chat._id.toString();
              createChatWrapperContent();
            }
          });
        if (chat.not_read_message_number) {
          if (eachChatLastMessage.childNodes[1]) {
            eachChatLastMessage.childNodes[1].innerHTML = chat.not_read_message_number;
          } else {
            const notRead = document.createElement('span');
            notRead.classList.add('chat-not-read-message');
            notRead.innerHTML = chat.not_read_message_number;
            eachChatLastMessage.appendChild(notRead);
          }
        } else if (eachChatLastMessage.childNodes[1]) {
          eachChatLastMessage.childNodes[1].remove();
        }
  
        let previousElement = eachChangeChatWrapper, previousElementCount = 0;
        while (previousElement.previousElementSibling) {
          previousElement = previousElement.previousElementSibling;
          previousElementCount++;
        }
        if (previousElementCount > i)
          while (previousElementCount > i) {
            eachChangeChatWrapper.parentNode.insertBefore(eachChangeChatWrapper, eachChangeChatWrapper.previousElementSibling);
            previousElementCount--;
          };
      } else {
        eachChangeChatWrapper = document.createElement('div');

        if (document.getElementById(chat.user_id.toString())) {// If it's a contact
          document.getElementById(chat.user_id.toString()).remove();
          if (document.querySelector('.selected-chat'))
            document.querySelector('.selected-chat').classList.remove('selected-chat');
          eachChangeChatWrapper.classList.add('selected-chat');
        }

        eachChangeChatWrapper.classList.add('each-change-chat-wrapper');
        eachChangeChatWrapper.id = chat._id;
  
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

        const eachChatLastMessageTime = document.createElement('span');
        eachChatLastMessageTime.classList.add('each-chat-last-message-time');
        eachChatLastMessageTime.innerHTML = chat.last_message.time;
        eachChatInfoTitleWrapper.appendChild(eachChatLastMessageTime);

        chatInfoWrapper.appendChild(eachChatInfoTitleWrapper);
  
        const eachChatLastMessage = document.createElement('span');
        eachChatLastMessage.classList.add('each-chat-last-message');
        const span = document.createElement('span');
        span.innerHTML = chat.last_message.content;
        eachChatLastMessage.appendChild(span);
        if (chat.not_read_message_number) {
          const notRead = document.createElement('span');
          notRead.classList.add('chat-not-read-message');
          notRead.innerHTML = chat.not_read_message_number;
          eachChatLastMessage.appendChild(notRead);
        }
        chatInfoWrapper.appendChild(eachChatLastMessage);
  
        eachChangeChatWrapper.appendChild(chatInfoWrapper);
  
        document.getElementById('recent-chats-wrapper').appendChild(eachChangeChatWrapper);
        while (eachChangeChatWrapper.previousElementSibling)
          document.getElementById('recent-chats-wrapper').insertBefore(eachChangeChatWrapper, eachChangeChatWrapper.previousElementSibling);
      }
    }

    setTimeout(() => {
      listenForChats();
    }, 1000);
  });
};

function uploadChatsAndContacts (callback) {
  getChats((err, chats) => {
    if (err) return callback(err);

    getContacts((err, contacts) => {
      if (err) return callback(err);

      // Push a new DOM document to the wrapper

      chats.forEach(chat => {
        const eachChangeChatWrapper = document.createElement('div');
        eachChangeChatWrapper.classList.add('each-change-chat-wrapper');
        eachChangeChatWrapper.id = chat._id;
  
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

        const eachChatLastMessageTime = document.createElement('span');
        eachChatLastMessageTime.classList.add('each-chat-last-message-time');
        eachChatLastMessageTime.innerHTML = chat.last_message.time;
        eachChatInfoTitleWrapper.appendChild(eachChatLastMessageTime);

        chatInfoWrapper.appendChild(eachChatInfoTitleWrapper);
  
        const eachChatLastMessage = document.createElement('span');
        eachChatLastMessage.classList.add('each-chat-last-message');
        const span = document.createElement('span');
        span.innerHTML = chat.last_message.content;
        eachChatLastMessage.appendChild(span);
        if (chat.not_read_message_number) {
          const notRead = document.createElement('span');
          notRead.classList.add('chat-not-read-message');
          notRead.innerHTML = chat.not_read_message_number;
          eachChatLastMessage.appendChild(notRead);
        }
        chatInfoWrapper.appendChild(eachChatLastMessage);
  
        eachChangeChatWrapper.appendChild(chatInfoWrapper);
  
        document.getElementById('recent-chats-wrapper').appendChild(eachChangeChatWrapper);
      });
      contacts.forEach(contact => {
        const eachChangeChatWrapper = document.createElement('div');
        eachChangeChatWrapper.classList.add('each-change-chat-wrapper');
        eachChangeChatWrapper.id = contact._id;
  
        const eachChangeChatProfilePhoto = document.createElement('div');
        eachChangeChatProfilePhoto.classList.add('each-change-chat-profile-photo');
        const img = document.createElement('img');
        img.src = contact.profile_photo;
        img.alt = `uaachat ${contact.name}`;
        eachChangeChatProfilePhoto.appendChild(img);
        eachChangeChatWrapper.appendChild(eachChangeChatProfilePhoto);
  
        const chatInfoWrapper = document.createElement('div');
        chatInfoWrapper.classList.add('chat-info-wrapper');
  
        const eachChatInfoTitleWrapper = document.createElement('div');
        eachChatInfoTitleWrapper.classList.add('each-chat-info-title-wrapper');
        const eachChatName = document.createElement('span');
        eachChatName.classList.add('each-chat-name');
        eachChatName.innerHTML = contact.name;
        eachChatInfoTitleWrapper.appendChild(eachChatName);
        chatInfoWrapper.appendChild(eachChatInfoTitleWrapper);
  
        const eachChatLastMessage = document.createElement('span');
        eachChatLastMessage.classList.add('each-chat-last-message');
        const span = document.createElement('span');
        span.innerHTML = contact.email.split('@')[0];
        eachChatLastMessage.appendChild(span);
        chatInfoWrapper.appendChild(eachChatLastMessage);
  
        eachChangeChatWrapper.appendChild(chatInfoWrapper);
  
        document.getElementById('contacts-wrapper').appendChild(eachChangeChatWrapper);
      });

      return callback(null);
    });
  });
};

function createChatWrapperContent () {
  // Creates the content of the chat wrapper using chat_id

  last_message = null;
  const chatWrapper = document.querySelector('.chat-wrapper');

  serverRequest(`/app/messages?chat_id=${chat_id}&timezone=${(new Date()).getTimezoneOffset()}`, 'GET', {}, response => {
    if (!response.success)
      giveError(response.error);

    const messages = response.messages;

    serverRequest(`/app/chat?_id=${chat_id}`, 'GET', {}, response => {
      if (response.success) {
        const chat = response.chat;
        global_chat = chat;
  
        chatWrapper.innerHTML = '';
        if (document.querySelector('.selected-chat'))
          document.querySelector('.selected-chat').classList.remove('selected-chat');
        document.getElementById(chat_id).classList.add('selected-chat');
    
        is_first_chat = messages.length ? false : true;
    
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
        img.src = chat.profile_photo;
        img.alt = chat.name;
        chatProfilePhoto.appendChild(img);
        chatProfileWrapper.appendChild(chatProfilePhoto);
    
        const chatInfoWrapper = document.createElement('div');
        chatInfoWrapper.classList.add('chat-info-wrapper');
    
        const chatName = document.createElement('span');
        chatName.classList.add('chat-name');
        chatName.innerHTML = chat.name;
        chatInfoWrapper.appendChild(chatName);
    
        const chatEmail = document.createElement('span');
        chatEmail.classList.add('chat-email');
        chatEmail.innerHTML = chat.email.split('@')[0];
        chatInfoWrapper.appendChild(chatEmail);
    
        chatProfileWrapper.appendChild(chatInfoWrapper);
    
        chatWrapper.appendChild(chatProfileWrapper);
    
        const chatMessagesWrapper = document.createElement('div');
        chatMessagesWrapper.classList.add('chat-messages-wrapper');
    
        chatWrapper.appendChild(chatMessagesWrapper);
    
        for (let i = 0; i < messages.length; i++)
          createMessage(messages[i]);
    
        const chatInputWrapper = document.createElement('div');
        chatInputWrapper.classList.add('chat-input-wrapper');
    
        const chatInput = document.createElement('input');
        chatInput.classList.add('chat-input');
        chatInput.type = 'text';
        chatInput.placeholder = messages.length ? 'Write your message' : 'Write your message to start the chat!';
        chatInputWrapper.appendChild(chatInput);
    
        chatWrapper.appendChild(chatInputWrapper);
      } else if (response.error == 'document_not_found') {
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

        const chatInputWrapper = document.createElement('div');
        chatInputWrapper.classList.add('chat-input-wrapper');
        const chatInput = document.createElement('input');
        chatInput.classList.add('chat-input');
        chatInput.type = 'text';
        chatInput.placeholder = response.messages.length ? 'Write your message' : 'Write your message to start the chat!';
        chatInputWrapper.appendChild(chatInput);

        chatWrapper.appendChild(chatInputWrapper);
      } else {
        return giveError(response.error);
      }
    });
  });
};

function uploadFirstChatMessages () {
  if (chat_id && is_first_chat)
    serverRequest(`/app/messages?chat_id=${chat_id}&timezone=${(new Date()).getTimezoneOffset()}`, 'GET', {}, response => {
      if (!response.success)
        callback(response.error);
  
      for (let i = 0; i < response.messages.length; i++)
        createMessage(response.messages[i]);
  
      callback(null)
    });
};

window.onload = () => {
  user = JSON.parse(document.getElementById('user-object').value);

  uploadChatsAndContacts(err => {
    if (err) return giveError(err);

    listenForChats(); // Listen for any change on chats
    listenForTheChatMessages(); // Listen for any changes on the messages of the current chat
    checkEarliestNotReadMessage(); // Listen for not read info change
    document.querySelector('.all-uploading-wrapper').style.display = 'none';
    document.querySelector('.all-wrapper').style.display = 'flex';
  });

  document.addEventListener('click', event => {
    if (event.target.classList.contains('each-change-chat-wrapper') || (event.target.parentNode && event.target.parentNode.classList.contains('each-change-chat-wrapper')) || (event.target.parentNode.parentNode && event.target.parentNode.parentNode.classList.contains('each-change-chat-wrapper')) || (event.target.parentNode.parentNode.parentNode && event.target.parentNode.parentNode.parentNode.classList.contains('each-change-chat-wrapper'))) {
      if (event.target.classList.contains('each-change-chat-wrapper')) {
        if (chat_id == event.target.id)
          return;
        chat_id = event.target.id;
      } else if (event.target.parentNode.classList.contains('each-change-chat-wrapper')) {
        if (chat_id == event.target.parentNode.id)
          return;
        chat_id = event.target.parentNode.id;
      } else if (event.target.parentNode.parentNode.classList.contains('each-change-chat-wrapper')) {
        if (chat_id == event.target.parentNode.parentNode.id)
          return;
        chat_id = event.target.parentNode.parentNode.id;
      } else if (event.target.parentNode.parentNode.parentNode.classList.contains('each-change-chat-wrapper')) {
        if (chat_id == event.target.parentNode.parentNode.parentNode.id)
          return;
        chat_id = event.target.parentNode.parentNode.parentNode.id;
      }

      document.querySelector('.menu-wrapper').style.zIndex = 1;
      createChatWrapperContent();
    }

    if (event.target.classList.contains('chat-go-back-button')) {
      document.querySelector('.menu-wrapper').style.zIndex = 3;
    }

    // if (event.target.classList.contains('profile-wrapper') || event.target.parentNode.classList.contains('profile-wrapper') || (event.target.parentNode.parentNode && event.target.parentNode.parentNode.classList.contains('profile-wrapper'))) {
    //   document.querySelector('.edit-profile-wrapper').classList.remove('close-left-animation-class');
    //   document.querySelector('.edit-profile-wrapper').classList.add('open-right-animation-class');
    // }

    // if (event.target.classList.contains('edit-profile-go-back-button') || event.target.parentNode.classList.contains('edit-profile-go-back-button')) {
    //   document.querySelector('.edit-profile-wrapper').classList.remove('open-right-animation-class');
    //   document.querySelector('.edit-profile-wrapper').classList.add('close-left-animation-class');
    // }
  });

  document.addEventListener('keydown', event => {
    if (event.key == 'Enter' && event.target.classList.contains('chat-input') && event.target.value.trim().length) {
      if (is_first_chat) {
        is_first_chat = false;
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
            return giveError(response.error);

          uploadFirstChatMessages();
          event.target.value = '';
        });
      } else {
        serverRequest(`/app/send_message`, 'POST', {
          type: 'text',
          content: event.target.value.trim(),
          sender_id: user._id,
          chat_id
        }, response => {
          if (!response.success)
            return giveError(response.error);

          event.target.value = '';
        });
      }
    }

    // if (event.key == 'Enter' && event.target.classList.contains('search-chat-input')) {
    //   searchChats(event.target.value, (err, chats) => {
    //     if (err)
    //       return alert(`An error occured, please try again later. Error Message: ` + err);
  
    //     reUploadChats(chats);
  
    //     searchContacts(event.target.value, (err, contacts) => {
    //       if (err)
    //         return alert(`An error occured, please try again later. Error Message: ` + err);
  
    //       return reUploadContacts(contacts);
    //     });
    //   });
    // }
  });
};

window.onfocus = () => {
  focused = true;
};

window.onblur = () => {
  focused = false;
};
