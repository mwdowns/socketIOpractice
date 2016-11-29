var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var room = '';
var listeners = [];
var speakerRoom = [];

app.use(express.static('public'));

io.on('connection', function(socket) {
  socket.on('user', function(data) {
    if (data.listener) {
      console.log('this user is a listener');
      console.log('this is the listeners array and should be empty', listeners.map(function(socket){
        return socket.nickname;
      }));
      if (data.username in listeners) {
        console.log('name taken');
      }
      else {
        socket.nickname = data.username;
        socket.room = 'listeners';
        listeners.push(socket);
        console.log('this is the listeners array and should be populated now', listeners.map(function(socket){
          return socket.nickname;
        }));
        socket.join(socket.room);
        updateListeners();
      }
      socket.on('user', function(data) {
        console.log('blah');
      });
    }
    else {
      console.log('this user is a speaker');
      socket.nickname = data.username;
      socket.room = data.username;
      speakerRoom.push(socket);
      console.log('hey ho, lets go. im speaker, this is the room name', socket.room);
      console.log('this is the list of available listeners', listeners.map(function(socket){
        return socket.nickname;
      }));
      socket.join(socket.room);
      io.emit('user room update', socket.room);
      updateSpeakerRoom();
      if (listeners.length > 0) {
        console.log('the listeners list is populated!');
      }
    }

  });
  console.log('a user connected');

  function updateListeners() {
    io.emit('sent listeners', listeners.map(function(socket){
      return socket.nickname;
    }));
  }

  function updateSpeakerRoom() {
    io.emit('sent users', speakerRoom.map(function(socket) {
      return socket.nickname;
    }));
  }

  socket.on('sent chat message', function(msg) {
    console.log('sent chat message:' + msg);
    io.sockets.in(socket.room).emit('recieved chat message', {message: msg, user: socket.nickname});
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');
    if(!socket.nickname) return;
    var index = listeners.indexOf(socket);
    var index2 = speakerRoom.indexOf(socket);
    if (index != -1) {
      listeners.splice(index, 1);
    }
    if (index2 != -1) {
      speakerRoom.splice(index2, 1);
    }
    updateListeners();
  });

});


http.listen(3000, function() {
  console.log('listening on *:3000');
});
