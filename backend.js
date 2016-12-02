var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var room = '';
var listeners = [];
var speakerRoom = [];
var listenersWithSpeakers = [];

app.use(express.static('public'));

//**************************************************
//THIS IS THE SOCKET.IO STUFF
//**************************************************

io.on('connection', function(socket) {
  // This part listens for which type of user is connecting and
  socket.on('user', function(data) {
    // then goes to this if statement to sort them. The if takes out any listeners that connect
    if (data.listener) {
      // (this probably doesn't need to be here since it's a relic from the original socket.io tutorial i followed...it checks to make sure the name is not taken)
      if (data.username in listeners) {
        console.log('name taken');
      }
      // Here is the start of the "listeners" section
      else {
        // This updates the users's socket with a key "username" and the value of the user's username
        socket.username = data.username;
        // This updates the user's socket with a key "room" and the value of "listeners"
        socket.room = 'listeners';
        // This pushes the socket object to the listeners array
        listeners.push(socket);
        // This moves the user into the "listeners" room
        socket.join(socket.room);
        // This sends the username to the frontend so that it can announce that this user has joined the room
        io.sockets.in(socket.room).emit('listeners update', socket.username);
        // This sends the updated listeners array to the frontend
        updateListeners();
      }
    }
    // This part of the if statment catches speakers as they connect.
    else {
      // This creates a privateRoom empty arry. This array should only ever have one or two entries and is specific to a speaker's room
      var privateRoom = [];
      // This pushes the user's username to the privateRooom array
      privateRoom.push(data.username);
      // This updates the user's socket with the key "username" and the value of the user's username.
      socket.username = data.username;
      // This updates the user's socket with the key "room" and the value of the user's username.
      socket.room = data.username;
      // This pushes the user's socket object to the speakerRoom array (we maby be able to do away with this part and just push the socket to the privateRoom array)
      speakerRoom.push(socket);
      console.log('hey ho, lets go. im speaker, this is the room name', socket.room);
      console.log('this is the list of available listeners', listeners.map(function(socket){
        return socket.username;
      }));
      console.log('this is the list of speakers', speakerRoom.map(function(socket){
        return socket.username;
      }));
      // This joins the user to the private room
      socket.join(socket.room);
      // This sends the room name to the frontend to update the name of the room
      io.sockets.in(socket.room).emit('user room update', socket.room);
      // This sends the privateRoom array to the frontend to update the list of users in the room
      io.sockets.in(socket.room).emit('sent users', privateRoom);
      // This part checks the numbers of listeners connected and will push the 0th index of that list into the speaker's newly created room
      if (listeners.length > 0) {
        // This takes the 0th index listener's username from the listeners array and pushes it to the privateRoom array
        privateRoom.push(listeners[0].username);
        // This sends a 'left room' message to the 'listeners' room saying that the listener has left.
        io.sockets.in('listeners').emit('left room', listeners[0].username);
        // This sends over the private room name and the listener's username to the frontend to announce to the the listener that they've been moved to a new room.
        io.emit('move message', {userRoom: socket.room, listener: listeners[0].username});
        // This disconnects the listener from the listener's room
        listeners[0].leave('listeners');
        // This changes the value of the "room" key on the listener's socket from "listeners" to the speaker's room
        listeners[0].room = socket.room;
        // This moves the listener to the user's room
        listeners[0].join(socket.room);
        // This sends over the listener's username to make an announcement that they've joined the room
        io.sockets.in(socket.room).emit('user room update', listeners[0].username);
        // This sends over the updated privateRoom array
        io.sockets.in(socket.room).emit('sent users', privateRoom);
        // listenersWithSpeakers.push(listeners[0]);
        speakerRoom.push(listeners[0]);
        // This removes the listener from the listeners array
        listeners.splice(0, 1);
      }
      updateListeners();
    }
  });
  console.log('a user connected');

  // This function sends to the frontend and the listeners array with only the usernames, not the rest of the socket information, so that the room list can be updated
  function updateListeners() {
    io.emit('sent listeners', listeners.map(function(socket){
      return socket.username;
    }));
  }

  // function updateSpeakerRoom() {
  //   io.emit('sent users', speakerRoom.map(function(socket) {
  //     return socket.username;
  //   }));
  // }

  // This listens to the frontend and when it hears 'sent chat message' from any socket it takes the data from that emit and sends it back to all sockets connected to that room. So if someone from the 'listeners' room types something it goes to all sockets in that room.
  socket.on('sent chat message', function(msg) {
    console.log('sent chat message:' + msg);
    io.sockets.in(socket.room).emit('recieved chat message', {message: msg, user: socket.username});
  });

  // This listens to the frontend and when it hears 'disconnect' from any socket it does these things. But now that I look at it again, it might not do anything, because it will not have any of this information because the socket no longer exists.
  socket.on('disconnect', function() {
    //It announces to the frontend that a user has left the room and the user's username
    console.log('speakerRoom length', speakerRoom.length);
    if (socket.room != socket.username) {
      console.log('this is bullshit');
      // console.log('this is the listeners array length', listeners.length);
      // console.log(speakerRoom.length);
    }
    io.sockets.in(socket.room).emit('left room', socket.username);
    console.log('user disconnected');
    //
    if(!socket.username) return;
    var index = listeners.indexOf(socket);
    var index2 = speakerRoom.indexOf(socket);
    if (index != -1) {
      console.log(socket.username);
      listeners.splice(index, 1);
    }
    if (index2 != -1) {
      console.log(socket.username);
      speakerRoom.splice(index2, 1);
      var listenerposition = speakerRoom.map(function(x) {
          return x.room;
        }).indexOf(socket.room);
      var listenerObject = speakerRoom.splice(listenerposition, 1);
      listenerObject[0].room = 'listeners';
      listeners.push(listenerObject[0]);
    }
    updateListeners();
  });

});


http.listen(3000, function() {
  console.log('listening on *:3000');
});
