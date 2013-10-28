/*
User Object:
{
	name:
	password:
	team:
	socket: null | socketObject
}
*/

var User = function(name, password, team) {
	if (arguments.length === 3) {
		this.name = name;
		this.password = password;
		this.team = team;

	}
	this.socket = null;

	console.log(this);
}

User.prototype.save = function() {
	UserStore.add(this);
};

User.prototype.auth = function(pass) {
	return this.password === pass;
};

User.prototype.connected = function(s) {
	this.socket = s;
}

User.prototype.disconnected = function() {
	this.socket = null;
}

var UserStore = {
	_store: [],

	findByTeam: function(team, real_obj) {
		var r = [];

		real_obj = real_obj === true ? true : false;

		for (var i in this._store) {
			if (this._store[i].team === team)
				r.push(real_obj ? this._store[i] : {name: this._store[i].name, online: this._store[i].socket !== null});
		}

		return r;
	},

	findByName: function(name) {
		for (var i in this._store) {
			if (this._store[i].name === name)
				return this._store[i];
		}
		return null;
	},

	login: function(name, password) {
		var u = this.findByName(name);
		if (u !== null && u.auth(password)) {
			return u;
		}
		return null;
	},

	add: function(user) {
		this._store.push(user);
	} 

}

// add a bunch of users


var a;
a = new User("vlad", "vlad", "team1");
a.save();

a = new User("river", "river", "team1");
a.save();

a = new User("radu", "radu", "team1");
a.save();

delete a;

// server work starts here

var fs = require('fs');

var staticFilesPort = process.env.PORT || 8000;
var socketioPort = 9000;

var io = require('socket.io').listen(socketioPort);

io.sockets.on("connection", function(socket) {

	var me = null;
	var myteam = null;

	socket.on("authenticate", function(data) {
		var u = UserStore.login(data.user, data.password);
		if (u !== null) {
			u.connected(socket);

			me = u;
			myteam = UserStore.findByTeam(me.team, true);

			socket.emit("auth_done", {
				"ok": true,
				"team": UserStore.findByTeam(me.team),
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

		var to = UserStore.findByName(data.to);

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
			var u = UserStore.findByName(dto[i]);
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
