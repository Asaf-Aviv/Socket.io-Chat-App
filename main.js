const express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    getLocation = require('./get-location'),
    sgMail = require('@sendgrid/mail'),
    Feedback = require('./models/feedback'),
    PORT = process.env.PORT || 8000;
    
// **** YOU NEED TO GENERATE SENDGRID API KEY IF YOU WANNA SEND EMAILS LIKE THIS ****
// sgMail.setApiKey(process.env.SENDGRID_API_KEY, () => {
//     const msg = {
//         to: 'example@gmail.com',
//         from: 'slickDev69@gmail.com',
//         subject: 'Sending with SendGrid is Fun',
//         text: 'and easy to do anywhere, even with Node.js',
//         html: '<strong>and easy to do anywhere, even with Node.js</strong>',
//       };
//       sgMail.send(msg);
// });
// 
// Feedback forms saved into my DB at mLab.com its free if you want to try 
// mongoose.connect(process.env.MONGO_ADMIN);

app
.use('/public', express.static(__dirname + '/public'))
.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/feedback', (req, res) => {
    Feedback.count((err, feedbackCount) => {
        if (err) return res.send(false);

        req.body.feedbackid = feedbackCount + 1
        new Feedback(req.body)
            .save()
            .then( () => res.send(true))
            .catch( () => res.send(false))
    });
});

let users = {};
let rooms = ['Lobby', 'Music', 'Movies']
let dynamicRooms = [];
let timeToClose = {};

setInterval( () => io.emit('adminMessage', "DONT FORGET TO LEAVE A FEEDBACK !!!"), 30000)

io.on('connection', socket => {

    socket.on('userAvailable', nickName => {
        for (let username in users) {
            if (users[username].name.toLowerCase() === nickName.toLowerCase()) {
                return io.emit('userTaken', nickName);
            }
        }
        socket.emit('userAvailable', nickName);
    });

    socket.on('setUsername', nickName => {
        users[socket.id] = {name: nickName, room: 'Lobby'};
        getLocation(socket.handshake.headers["x-forwarded-for"]).then(client => {
            io.to('Lobby').emit('newClientConnected', users[socket.id].name + " connected from " + client.country_name);
        });

        let onlineUsers = Object.keys(users).filter(k => users[k].room === 'Lobby').map(k => users[k].name);
        socket.leave(socket.id);
        socket.join('Lobby');
        socket.emit('getOnlineUsers', onlineUsers);
        socket.emit('roomJoin', "Now talking in Lobby" );
        socket.emit('getRooms', dynamicRooms);
        socket.to('Lobby').emit('userJoin', users[socket.id].name);
    });

    socket.on('newMessage', msg => {
        let room = users[socket.id].room;
        io.to(room).emit('newMessage', room, users[socket.id].name + " : " + msg);
    });

    socket.on('join', room => {
        let prevRoom = Object.keys(socket.rooms)[0];
        if (prevRoom === room) return;
        clearTimeout(timeToClose[room])
        
        users[socket.id].room = room;
        let nickName = users[socket.id].name;
        let onlineUsers = Object.keys(users).filter(k => users[k].room === room).map(k => users[k].name);
        
        socket.emit('leave', prevRoom);
        socket.leave(prevRoom);
        socket.join(room);
        socket.emit('selfJoin', room, "Now talking in " + room);
        socket.emit('getOnlineUsers', onlineUsers); 
        socket.to(room).emit('roomJoin', room, nickName + ' joined ' + room);
        socket.to(room).emit('userJoin', nickName);
    });

    socket.on('roomAvailable', room => {
        for (let roomName in rooms) {
            if (rooms[roomName].toLowerCase() === room.toLowerCase()) {
                return socket.emit('roomExists', room);
            }
        }
        dynamicRooms.push(room);
        io.emit('updateRooms', room);
        socket.emit('roomCreated', Object.keys(socket.rooms)[0] , room);
    });

    socket.on('leave', room => {
        if (room !== 'Lobby' && room !== 'Music' && room !== 'Movies') {
            if (!io.sockets.adapter.rooms[room]) {
                timeToClose[room] = setTimeout( () => io.emit('roomClosed', room), 60000);
            }
        }
        let nickName = users[socket.id].name;
        
        io.in(room).emit('userLeft', nickName);
        io.in(room).emit('roomLeave', room, nickName + ' has left ' + room);
    });

    // socket.on('typing', () => {
    //     socket.to(Object.keys(socket.rooms)[0]).emit('typing', users[socket.id].name);
    //     // socket.broadcast.emit('typing', users[socket.id]);
    // });

    // socket.on('clear', () => {
    //     socket.broadcast.emit('clear');
    // });
    
    socket.on('deleteRoom', room => dynamicRooms.splice(dynamicRooms.indexOf(room), 1))

    socket.on('disconnect', () => {
        if(users[socket.id]) {
            let room = users[socket.id].room;
            let nickName = users[socket.id].name;
            io.in(room).emit('userDisconnect', room, nickName + " has been Disconnected");
            io.in(room).emit('userLeft', nickName);
            delete users[socket.id];
        }
    });
});

process.on('uncaughtException', err => {
    console.log(`Caught exception: ${err}\n`);
  });

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
