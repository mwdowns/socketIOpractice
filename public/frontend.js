//*********************************************
//THIS IS THE SOCKET.IO STUFF
//*********************************************

//this function here is for testing purposes only. once we get angular supplying the info, we can delete it and the weird values in the object in var user below.
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
var user = {username: getParameterByName('username'), listener: getParameterByName('listener') === 'true', paired: getParameterByName('paired') === 'true'};

//these are extracted functions used in the logic

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
    $('#title').html("This is the Listeners' pool");
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
    $('#title').html("This is " + users[0] + "'s room");
  });
}

function moveAnnouncement() {
  socket.on('move message', function(data) {
    console.log('your name is ' + user.username + " and the room belongs to " + data.listener);
    if (user.username === data.listener) {
      $chat.append("<li>You have left the Listeners' room and just joined <b>" + data.userRoom + "</b>'s room.");
    }
  });
}

function roomUpdateAnnouncement() {
  socket.on('user room update', function(data) {
    if (data === user.username) {
      $chat.append("<li>Welcome to <b>" + data + "</b>'s room");
    }
    else {
      $chat.append("<li><b>" + data + "</b> has just joined your room.");
    }
  });
}

function emitMessage() {
  socket.emit('sent chat message', $message.val());
  $chat.append("<li><b>" + user.username + "</b>" +  ": " + $message.val() + "</li>");
  $message.val('');
}

function leftRoomMessage() {
  socket.on('left room', function(data) {
    if (user.username != data) {
      $chat.append("<li><b>" + data + "</b> has just left your room.");
    }
  });
}

//this is the main logic for socket.io

if (user.listener) {
  console.log('this user is a listener');
  // socket.emit('create', 'listeners');
  connectUser();
  // updateListenerList();
  socket.on('listeners update', function(data) {
    console.log(user.username, data);
    if (user.username != data) {
      $chat.append("<li><b>" + data + "</b> has just joined the listeners room.");
    }
  });
  moveAnnouncement();
  if (user.paired) {
    updateSpeakerRoomList();
  }
  else {
    leftRoomMessage();
    updateListenerList();
  }
  // leftRoomMessage();
  // updateListenerList();

}
else {
  console.log('this user is a speaker');
  // socket.emit('create', user.username);
  connectUser();
  roomUpdateAnnouncement();
  leftRoomMessage();
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
