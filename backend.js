var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];

app.use(express.static('public'));

io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
    if(!socket.nickname) return;
    users.splice(users.indexOf(socket.nickname), 1);
    updateNickname();
  });

  function updateNickname() {
    io.emit('usernames', users);
  }

  socket.on('new user', function(data, callback) {
    if (users.indexOf(data) != -1) {
      callback(false);
    }
    else {
      callback(true);
      socket.nickname = data;
      users.push(socket.nickname);
      updateNickname();
    }
  });
  socket.on('sent chat message', function(msg) {
    console.log('sent chat message:' + msg);
    io.emit('recieved chat message', {message: msg, user: socket.nickname});
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
