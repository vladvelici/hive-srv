
var fs = require('fs');

var staticFilesPort = process.env.PORT || 8000;
var socketioPort = 9000;

var um = require('./users');

var io = require('socket.io').listen(socketioPort);

io.sockets.on("connection", function(socket) {

	var me = null;
	var myteam = null;

	socket.on("authenticate", function(data) {
		var u = um.store.login(data.user, data.password);
		if (u !== null) {
			u.connected(socket);

			me = u;
			myteam = um.store.findByTeam(me.team, true);

			socket.emit("auth_done", {
				"ok": true,
				"team": um.store.findByTeam(me.team),
				"me": {
					name: me.name,
					team: me.team
				}
			});

			for (var i in myteam) {
				var j = myteam[i];
				if (j.name !== me.name && j.socket !== null) {
					j.socket.emit("memberConnected", {"name": me.name});
				}
			}

		} else {
			me = null;
			myteam = null;
			socket.emit("auth_done", {"ok": false, "err": "Wrong username or password."});
		}
	});

	socket.on("sendMsg", function(data) {
		if (me === null) return;

		var to = um.store.findByName(data.to);

		if (to === null || to.socket === null) {
			return;
		}

		if (to.team !== me.team) { 
			return;
		}

		to.socket.emit("message", {from: me.name, message: data.msg});
	});

	socket.on("sendGroupMsg", function(data) {
		if (me === null) return;

		var dto = data.to;
		var to = [];
		var group = [];

		for (var i in dto) {
			var u = um.store.findByName(dto[i]);
			if (u !== null && u.socket !== null && u.team === me.team) {
				to.push(u);
				group.push(u.name);
			}
		}

		group.push(me.name);

		for (var i in to) {
			to[i].socket.emit("groupMessage", {from: me.name, group: group, message: data.msg});
		}
	});

	socket.on("initVideo", function(data) {
		if (me === null) return;

		var to = um.store.findByName(data.to);

		if (to === null || to.socket === null) {
			return;
		}

		if (to.team !== me.team) { 
			return;
		}

		to.socket.emit("incomingCall", {from: me.name, rtcReq: data.rtcReq});		
	});

	socket.on("answerVideo", function(data) {
		if (me === null) return;

		var to = um.store.findByName(data.to);

		if (to === null || to.socket === null) {
			return;
		}

		if (to.team !== me.team) {
			return;
		}

		to.socket.emit("answerCall", {from: me.name, rtcRes: data.rtcRes});		

	});

	socket.on("disconnect", function() {
		if (me !== null) {
			me.disconnected();
			for (var i in myteam) {
				var j = myteam[i];
				if (j.name !== me.name && j.socket !== null) {
					j.socket.emit("memberDisconnected", {"name": me.name});
				}
			}
		}
	});

});

// Static file server:
var connect = require('connect'),
    http = require('http');

connect()
	.use(connect.static('public'))
	.listen(staticFilesPort);

// Nice greeting so you know it works:
console.log("Server started at http://localhost:" + staticFilesPort);
console.log("Socket.io is on port " + socketioPort);
