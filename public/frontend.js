$(function() {
var socket = io();
var $messageForm = $('#sendMessage');
var $message = $('#m');
var $chat = $('#messages');
var $nickForm = $('#setNick');
var $nickError = $('#nickError');
var $nick = $('#nickname');

$nickForm.submit(function(e) {
  e.preventDefault();
  console.log('hello');
  socket.emit('new user', $nick.val(), function(data) {
    if (data) {
      $('#nickWrap').hide();
      $('#contentWrap').show();
    }
    else {
      $nickError.html('Please choose another nickname');
    }
  });
  $nick.val('');
});

socket.on('usernames', function(users) {
  console.log(users.length);
  var chatusers = '';
  for (var i = 0; i < users.length; i++) {
    chatusers += users[i] + '<br>';
  }
  $('#userlist').html(chatusers);
});

$messageForm.submit(function(e){
  e.preventDefault();
  socket.emit('sent chat message', $message.val());
  $message.val('');
  return false;
});

socket.on('recieved chat message', function(data){
  $chat.append("<li><b>" + data.user + "</b>" +  ": " + data.message + "</li>");
});

});
