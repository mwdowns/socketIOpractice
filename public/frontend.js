var app = angular.module('cope', ['ui.router', 'ngCookies',
'btford.socket-io']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: 'chat',
    url: '/{username}/{listener}/{paired}',
    templateUrl: 'chat.html',
    controller: 'ChatController'
  });
});

app.factory('socket', function(socketFactory) {
  return socketFactory();
});

app.controller('ChatController', function($scope, socket, $stateParams, $state, $rootScope, $cookies) {
  // if ($cookies.getObject('listener')) {
  //   $scope.listener = true;
  // } else {$scope.listener = false;}
  //
  // if ($cookies.getObject('paired')) {
  //   $scope.paired = true;
  // } else {$scope.paired = false;}
  // $scope.username = $cookies.getObject('username');
  $scope.username = $stateParams.username;
  $scope.listener = $stateParams.listener === 'true';
  $scope.paired = $stateParams.paired === 'true';
  $scope.user = {username: $scope.username, listener: $scope.listener, paired: $scope.paired};
  $scope.chatLog = [];
  $scope.listeners = '';
  $scope.imalistener = true;

  function connectUser() {
    socket.on('connect', function() {
      socket.emit('user', $scope.user);
      console.log('this is the user', $scope.user);
    });
  }

  $scope.emitMessage = function emitMessage() {
    console.log($scope.newMessage);
    socket.emit('sent chat message', $scope.newMessage);
    $scope.chatLog.push({message: $scope.newMessage, username: $scope.username});
    $scope.newMessage = '';
  };

  socket.on('recieved chat message', function(data){
    if ($scope.user.username != data.username) {
      $scope.chatLog.push({message: data.message, username: data.username});
    }
  });

  function updateListeners() {
    socket.on('sent listeners', function(users) {
      $scope.listeners = users;
      console.log('these are the listeners in the listeners room', users);
    });
  }

  function updateSpeakerRoom() {
    socket.on('sent users', function(users) {
      $scope.speakers = users;
      console.log('these are the speakers online', users);
    });
  }

  function updateSpeakerRoomList() {
    socket.on('sent users', function(users) {
      console.log('these are the speakers in the room', users);
      $scope.imalistener = false;
      $scope.speakers = users;
      console.log($scope.imalistener);
    });
  }

  function roomUpdateAnnouncement() {
    socket.on('user room update', function(data) {
      $scope.message = {message: '', username: 'Announcement'};
      console.log(data, $scope.user.username);
      if (data === $scope.user.username) {
        $scope.message.message = "Welcome to <b>" + $scope.user.username + "</b>'s room";
        $scope.chatLog.push($scope.message);
      }
      else {
        $scope.message.message = "<b>" + data + "</b> has just joined your room";
        $scope.chatLog.push($scope.message);
      }
    });
  }

  function moveAnnouncement() {
    socket.on('move message', function(data) {
      $scope.message = {message: '', username: 'Announcement'};
      $scope.imalistener = false;
      if ($scope.user.username === data.listener) {
        console.log('your name is ' + $scope.user.username + " and the room belongs to " + data.userRoom);
        $scope.message.message = "You have left the Listeners' room and just joined <b>" + data.userRoom + "</b>'s room.";
        $scope.chatLog.push($scope.message);
      }
    });
  }

  socket.on('speaker left room', function(room) {
    $scope.message = {message: '', username: 'Announcement'};
    if ($scope.user.username != room) {
      console.log("the speaker left the room. would you like to go back to the listeners' room?");
      $scope.message.message = room + " has just left the room. Would you like go back to the listeners's room?";
      $scope.chatLog.push($scope.message);
    }
  });

  if ($scope.user.listener) {
    console.log('this user is a listener');
    connectUser();
    updateListeners();
    // socket.on('listeners update', function(data) {
    //   console.log(user.username, data);
    //   if (user.username != data) {
    //     $chat.append("<li><b>" + data + "</b> has just joined the listeners room.");
    //   }
    // });
    moveAnnouncement();
    if ($scope.user.paired) {
      console.log($scope.user.paired);
      // $scope.paired = true;
      updateSpeakerRoomList();
    }
    else {
      // leftRoomMessage();
      updateListeners();
    }
  }
  else {
    console.log('this user is a speaker');
    $scope.imalistener = false;
    connectUser();
    updateSpeakerRoom();
    roomUpdateAnnouncement();
    // leftRoomMessage();
  }

});

//*********************************************
//THIS IS THE SOCKET.IO STUFF
//*********************************************

//this function here is for testing purposes only. once we get angular supplying the info, we can delete it and the weird values in the object in var user below.
// function getParameterByName(name, url) {
//     if (!url) {
//       url = window.location.href;
//     }
//     name = name.replace(/[\[\]]/g, "\\$&");
//     var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
//         results = regex.exec(url);
//     if (!results) return null;
//     if (!results[2]) return '';
//     return decodeURIComponent(results[2].replace(/\+/g, " "));
// }
//
// $(function() {
// var socket = io();
// var $messageForm = $('#sendMessage');
// var $message = $('#m');
// var $chat = $('#messages');
// var user = {username: getParameterByName('username'), listener: getParameterByName('listener') === 'true', paired: getParameterByName('paired') === 'true'};
//
// //these are extracted functions used in the logic
//
// function connectUser() {
//   socket.on('connect', function() {
//     socket.emit('user', user);
//     console.log('this is the user', user);
//   });
// }
//
// function updateListenerList() {
//   socket.on('sent listeners', function(users) {
//     console.log('these are the listeners in the room', users);
//     var chatusers = '';
//     for (var i = 0; i < users.length; i++) {
//       chatusers += users[i] + '<br>';
//     }
//     $('#userlist').html(chatusers);
//     $('#title').html("This is the Listeners' pool");
//   });
// }
//
// function updateSpeakerRoomList() {
//   socket.on('sent users', function(users) {
//     console.log('these are the speakers online', users);
//     var chatusers = '';
//     for (var i = 0; i < users.length; i++) {
//       chatusers += users[i] + '<br>';
//     }
//     $('#userlist').html(chatusers);
//     $('#title').html("This is " + users[0] + "'s room");
//   });
// }
//
// function moveAnnouncement() {
//   socket.on('move message', function(data) {
//     console.log('your name is ' + user.username + " and the room belongs to " + data.listener);
//     if (user.username === data.listener) {
//       $chat.append("<li>You have left the Listeners' room and just joined <b>" + data.userRoom + "</b>'s room.");
//     }
//   });
// }
//
// function roomUpdateAnnouncement() {
//   socket.on('user room update', function(data) {
//     if (data === user.username) {
//       $chat.append("<li>Welcome to <b>" + data + "</b>'s room");
//     }
//     else {
//       $chat.append("<li><b>" + data + "</b> has just joined your room.");
//     }
//   });
// }
//
// function emitMessage() {
//   socket.emit('sent chat message', $message.val());
//   $chat.append("<li><b>" + user.username + "</b>" +  ": " + $message.val() + "</li>");
//   $message.val('');
// }
//
// function leftRoomMessage() {
//   socket.on('left room', function(data) {
//     if (user.username != data) {
//       $chat.append("<li><b>" + data + "</b> has just left your room.");
//     }
//   });
// }
//
// //this is the main logic for socket.io
//
// if (user.listener) {
//   console.log('this user is a listener');
//   // socket.emit('create', 'listeners');
//   connectUser();
//   // updateListenerList();
//   socket.on('listeners update', function(data) {
//     console.log(user.username, data);
//     if (user.username != data) {
//       $chat.append("<li><b>" + data + "</b> has just joined the listeners room.");
//     }
//   });
//   moveAnnouncement();
//   if (user.paired) {
//     updateSpeakerRoomList();
//   }
//   else {
//     leftRoomMessage();
//     updateListenerList();
//   }
//   // leftRoomMessage();
//   // updateListenerList();
//
// }
// else {
//   console.log('this user is a speaker');
//   // socket.emit('create', user.username);
//   connectUser();
//   roomUpdateAnnouncement();
//   leftRoomMessage();
//   updateSpeakerRoomList();
// }
//
// $messageForm.submit(function(e){
//   e.preventDefault();
//   emitMessage();
// });
//

//
// });
