function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(function() {
var socket = io();
var $messageForm = $('#sendMessage');
var $message = $('#m');
var $chat = $('#messages');
var $nickForm = $('#setNick');
var $nickError = $('#nickError');
var $nick = $('#nickname');
var nickname = '';
var user = {username: getParameterByName('username'), listener: getParameterByName('listener') === 'true'};

function connectUser() {
  socket.on('connect', function() {
    socket.emit('user', user);
    console.log('this is the user', user);
  });
}


function updateListenerList() {
  socket.on('sent listeners', function(users) {
    console.log('these are the listeners in the room', users);
    var chatusers = '';
    for (var i = 0; i < users.length; i++) {
      chatusers += users[i] + '<br>';
    }
    $('#userlist').html(chatusers);
  });
}

function updateSpeakerRoomList() {
  socket.on('sent users', function(users) {
    console.log('these are the speakers online', users);
    var chatusers = '';
    for (var i = 0; i < users.length; i++) {
      chatusers += users[i] + '<br>';
    }
    $('#userlist').html(chatusers);
  });
}

function emitMessage() {
  socket.emit('sent chat message', $message.val());
  $chat.append("<li><b>" + user.username + "</b>" +  ": " + $message.val() + "</li>");
  $message.val('');
}

function roomWelcomeMessage() {
  socket.on('user room update', function(roomName) {
    $chat.append("<li>Welcome to <b>" + roomName + "</b>'s room");
  });
}

if (user.listener) {
  console.log('this user is a listener');
  socket.emit('create', 'listeners');
  connectUser();
  updateListenerList();
}
else {
  console.log('this user is a speaker');
  socket.emit('create', user.username);
  connectUser();
  socket.on('user room update', function(roomName) {
    console.log('hi');
    if (roomName === user.username) {
      $chat.append("<li>Welcome to <b>" + roomName + "</b>'s room");
    }
  });
  updateSpeakerRoomList();
}

$messageForm.submit(function(e){
  e.preventDefault();
  emitMessage();
});

socket.on('recieved chat message', function(data){
  if (user.username != data.user) {
    $chat.append("<li><b>" + data.user + ":</b> " + data.message + "</li>");
  }
});

});
