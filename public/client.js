$('#Lobby').addClass('room-selected');
$('#chat-container').hide(0);
$('section.contact').hide(0);
$('.create-room-box').hide(0);
$('.form-success').hide(0);
$('.form-error').hide(0);
$('.Music-room').hide(0);
$('.Movies-room').hide(0);
$('.create-room-box').draggable();
$('.form-error').draggable();
$('.form-success').draggable();
$("section.contact > form").draggable();
$('#userName').focus();
$(function () {
    // $('#nickname-box').hide();
    const socket = io();

    $('#nickname-box form').submit(() => {
        if ($('#userName').val().length > 1) {
            socket.emit('userAvailable', $('#userName').val())
        } 
        return false;
    });

    socket.on('userAvailable', nickName => {
        socket.emit('setUsername', nickName);
        $('#nickname-box').remove();
        $('#chat-container').show(0);
        $('#m').focus();
    })

    $('#input-box button').on('click', function(){
        socket.emit('newMessage', $('#m').val());
        $('#m').val('');
        return false;
    });

    // $('#input-box input').on('keyup', e => {
    //     if ($('#m').val().length > 0) {
    //         socket.emit('typing');
    //     } else {
    //         socket.emit('clear');
    //     }
    // });

    $('#input-box input').on('keypress', e => {
        if (e.which === 13) {
            socket.emit('newMessage', $('#m').val());
            $('#m').val('');
        }
    });

    socket.on('selfJoin', (room, msg) => {
        $(`.${room}-room`).append($('<li>').text(getDate() + msg).css('font-style', 'italic'))
    });

    socket.on('userJoin', user => {
        $('#online-users').append($('<li>').text(user));
    });

    socket.on('userLeft', user => {
        $(`#online-users li:contains(${user})`).remove();
    });

    socket.on('getOnlineUsers', onlineUsers => {
        $('#online-users li').remove();
        $.each(onlineUsers, user => {
            $('#online-users').append($('<li>').text(onlineUsers[user]));
        });
    });

    socket.on('getRooms', rooms => {
        //         $('#room-list ul').append(`<li id=${room}>${room}`);
        // $('#chat-box').append(`<ul id=messages-box class=${room}-room style="display: none;">`);
        $.each(rooms, room => {
            $('#room-list ul').append($(`<li id=${rooms[room]}>`).text(rooms[room]));
            $('#chat-box').append(`<ul id=messages-box class=${rooms[room]}-room style="display: none;">`);
        });
    });

    socket.on('adminMessage', msg => {
        $('#admin-messages h3').hide(0).text(msg).fadeIn(1000, 'swing',
            setTimeout(() => $('#admin-messages h3').fadeOut(2000), 7000));
    });

    socket.on('newMessage', (room, msg) => {
        $(`.${room}-room`).append($('<li>').text(getDate() + msg));
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
        socket.emit('clear');
    });

    $('#room-list ul').on('click', 'li', function(e) {
        let room = $(this).attr('id');
        socket.emit('join', room);
        $(`.${room}-room`).show(0);
        $('#room-list ul li').removeClass('room-selected');
        $(this).addClass('room-selected');
    });

    socket.on('roomClosed', room => {
        $(`#${room}`).remove();
        $(`.${room}-room`).remove();
        socket.emit('deleteRoom', room);
    });

    socket.on('leave', room => {
        $(`.${room}-room`).hide(0);
        socket.emit('leave', room);
    });

    socket.on('roomJoin', (room, msg) => {
        $(`.${room}-room`).append($('<li>').text(getDate() + msg).css('font-style', 'italic'));
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    });

    socket.on('roomLeave', (room, msg) => {
        $(`.${room}-room`).append($('<li>').text(getDate() + msg).css('font-style', 'italic'));
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    });

    socket.on('newClientConnected', msg => {
        $('#messages-box').append($('<li>').text(getDate() + msg).css('font-style', 'italic'));
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    });

    socket.on('userDisconnect', (room, msg) => {
        $(`.${room}-room`).append($('<li>').text(getDate() + msg).css('font-style', 'italic'));
        socket.emit('userLeft', nickName);
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    });

    socket.on('userTaken', nickName => {
        $('#nickname-box span').html(nickName + ' is taken!');
    });

    
    // socket.on('typing', nickName => {
    //     $('#user-typing').html(nickName + " is typing");
    // });

    $('aside.left1.open').click(function() {
        $('section.contact').toggle();
    });

    socket.on('clear', () => {
        $('#user-typing').html("");
    });

    $('.feedback > button').click(function() {
        $('section.contact').toggle();
    });

    $('.fa-close').click(function() {
        $('section.contact').hide(0);
    });

    $('.contact fieldset > input[value=Cancel]').click(function() {
        $('section.contact').hide(0);
    });

    $('.form-success').click( () => {
        $('.form-success').hide(0);
    });

    $('.create-room > button').click(function() {
        $('.create-room-box').toggle();
        $('#room-name').focus();
    });

    $('.create-room-box').keyup(function(e) {
        if (e.keyCode === 13) {
            $('.create-room-box > input[value=Open]').click();
        } else if (e.keyCode === 27) {
            $('.create-room-box > input[value=Cancel]').click();
        }
    });

    $('.create-room-box > input[value=Cancel]').click(function() {
        $('.create-room-box').hide(0);
    });

    $('.create-room-box > input[value=Open]').click(function() {
        let room = $('#room-name').val();
        socket.emit('roomAvailable', room);
        // $('.create-room-box').hide();
    });

    socket.on('updateRooms', room => {
        console.log('updating rooms')
        $('#room-list ul').append(`<li id=${room}>${room}`);
        $('#chat-box').append(`<ul id=messages-box class=${room}-room style="display: none;">`);
    });

    socket.on('roomCreated', (prevRoom, room) => {
        socket.emit('join', room);
        $('.create-room-box').hide(0);
        $(`#${prevRoom}-room`).hide(0);
        $(`#${prevRoom}`).removeClass('room-selected');
        $(`#${room}`).addClass('room-selected');
        $(`.${room}-room`).show(0);
    });

    socket.on('roomExists', room => {
        $('.create-room-box span').html(room + ' already exist')
    });

    $('.create-room-box > input[value=Cancel]').click(function() {
        $('.create-room-box').hide(0);
    });

    $('.form-error').click( () => {
        $('.form-error').hide(0);
        $('section.contact').show(0);
    });

    $('.contact').unbind().submit(function(e) {
        e.preventDefault();
        
        $.ajax({
            type: "POST",
            url: "/feedback",
            data: {
                name: $('#feedback-name').val(),
                email: $('#feedback-email').val(),
                rating: $('input[name=rating]:checked').val(),
                message: $('#feedback-message').val()
            },
            success: function(formSuccess) {
                if (formSuccess) {
                    $('.contact').fadeOut(100);
                    $('.form-success').fadeIn();
                } else {
                    $('.contact').fadeOut(100);
                    $('.form-error').fadeIn();
                }
            }
        });
    });
});

function getDate() {
    let dateNow = new Date();
    let hours = dateNow.getHours();
    let minutes = dateNow.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    return `${hours}:${minutes} `;
}