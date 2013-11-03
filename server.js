
var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');


var srvPort = process.env.PORT || 8000;

var app = express();


var um = require('./users');


function defaultRequestHandler (req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var page = fs.readFileSync('./public/index.html', 'utf8');
	res.write(page);
	res.end();
	console.log("Default page served");
}

app.use(express.bodyParser());

app.get('/', defaultRequestHandler);
app.use('/p', express.static(__dirname + '/public'));

var httpServer = http.createServer(app);
httpServer.listen(srvPort);

var io = require('socket.io').listen(httpServer);

// huddleProxy.attach(app, 'Bens%20Huddle%20hacks', 'localhost:8000', defaultRequestHandler);

var cpClipboard = "";
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

	socket.on("cp:copy", function(data) {
		cpClipboard = data;
		io.sockets.emit("cp:clipboard", data);
	});

	socket.on("cp:paste", function(data) {
		socket.emit("cp:text", cpClipboard);
	});

	socket.on("sendMsg", function(data) {
		if (me === null) return;

		var sendIt = function(d, group) {
			var r = {
				from: me.name,
				message: d.msg
			}
			if (group) r.group = group;

			d.to.socket.emit("message", r);
		}

		if (typeof data.to === 'string') {
			var to = um.store.findByName(data.to);
			if (to !== null && to.socket !== null && to.team === me.team) {
				sendIt({to: to, msg: data.msg});
			}
		} else {
			var dto = data.to;
			var group = [];
			var gs = [];
			for (var i in dto) {
				var to = um.store.findByName(dto[i]);
				if (to !== null && to.socket !== null && to.team === me.team) {
					group.push(to.name);
					gs.push(to);
				}
			}

			for (var i in group) {
				sendIt({to: gs[i], msg: data.msg}, group);
			}
		}

	});

	socket.on("sendFile", function(data) {
		if (me === null) return;

		var sendIt = function(d, group) {
			var r = {
				from: me.name,
				file: d.file,
				fileName: d.fileName
			}
			if (group) r.group = group;

			d.to.socket.emit("file", r);
		}

		if (typeof data.to === 'string') {
			var to = um.store.findByName(data.to);
			if (to !== null && to.socket !== null && to.team === me.team) {
				sendIt({to: to, file: data.file, fileName: data.fileName});
			}
		} else {
			var dto = data.to;
			var group = [];
			var gs = [];
			for (var i in dto) {
				var to = um.store.findByName(dto[i]);
				if (to !== null && to.socket !== null && to.team === me.team) {
					group.push(to.name);
					gs.push(to);
				}
			}

			for (var i in group) {
				sendIt({to: gs[i], file: data.file, fileName: data.fileName}, group);
			}
		}

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

// Nice greeting so you know it works:
console.log("Server started on port " + srvPort);