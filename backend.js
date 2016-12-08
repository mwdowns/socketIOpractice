
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var room = '';
var connectedUsers = [];
var listeners = [];
var speakerRoom = [];
var listenersWithSpeakers = [];

app.use(express.static('public'));

io.on('connection', function(socket) {
  console.log('this is info', socket.id);
  socket.on('user', function(userData) {
    console.log(userData);
    socket.username = userData.username;
    socket.listener = userData.listener;
    socket.paired = userData.paired;
  });
  console.log('these are the conncected users', connectedUsers);
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
