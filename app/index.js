import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io(window.location.origin);

const messageInputText = document.getElementById('message');
const roomId = document.getElementById('room-id').value;

if(roomId) {
   socket.emit('join-room', roomId);
   window.onload = () => {
      scrollToBottom(messageScrollContainer, messagesContainer, 0.3);
   }
}

let token;
const sendMessage = document.getElementById('send-message');
sendMessage.addEventListener('click', postMessage);
messageInputText.addEventListener('keyup', e => {
   if(e.key === 'Enter') {
      postMessage(e)
   }
})
function postMessage(e) {
   if(messageInputText.value) {
      axios.post('/message/create', {
         message: messageInputText.value,
         roomId: roomId
      }, {
         headers: {
            'Content-Type': 'application/json'
         }
      }).then(response => {
         console.log(response.data);
         messageInputText.value = '';
         token = (Math.random()*10000).toString(16).replace('.', '');
         socket.emit('send-message', { 
            message: response.data.message, 
            token 
         });
      }).catch(err => {
         window.location.replace('/login');
      })
   }
}

const messageTemplate = document.getElementById('message-template').content;
const messagesContainer = document.getElementById('messages-container');
socket.on('create-message-html', data => {
   const { message, tokenFromServer } = data;
   const clone = messageTemplate.cloneNode(true);
   const messageBox = clone.querySelector('.message-box');
   messageBox.querySelector('.message-content').innerText = message.content;
   messageBox.querySelector('.message-by').innerText = message.createdBy;
   if(tokenFromServer === token) {
      messageBox.classList.add('right');
   }
   messagesContainer.appendChild(messageBox);
   scrollToBottom(messageScrollContainer, messagesContainer, 0.3);
})

const messageScrollContainer = document.querySelector('.messages-flex-container');

function scrollToBottom(containerElement, innerElement, second) {
   const timeOut = 10;
   let count = 0;
   const counter = second * 1000 / timeOut;
   const difference = Math.abs(containerElement.scrollTop +20 - (containerElement.offsetHeight - innerElement.offsetHeight));
   const distancePerTimeOut = difference / counter;
   let currentScrollTop = containerElement.scrollTop;
   let scroll = setInterval(() => {
      if(count == counter) {
         clearInterval(scroll);
      }
      currentScrollTop += distancePerTimeOut;
      containerElement.scrollTop = currentScrollTop;
      count++;
   }, timeOut)
}