console.log("file loaded");

var Auth = {
	user: null,
	loginReq: null,
	teamMembers: [],

	loginRes: function(data) {
		this.user = data.me;
		this.teamMembers = data.team;

		var myname = document.createElement("h1");
		myname.appendChild(document.createTextNode(data.me.name));
		myname.className = "myname";
		document.getElementById("loginForm").parentNode.appendChild(myname);
		document.getElementById("loginForm").style.display = "none";
		this.user = data.me;

		teamUi.addTeamMembers(data.team);
	},

	setOffine: function(data) {
		for (var i in this.teamMembers) {
			if (this.teamMembers[i].name == data.name) {
				this.teamMembers[i].online = false;
				teamUi.update(data.name, false);
				return;
			}
		}
	},

	setOnline: function(data) {
		for (var i in this.teamMembers) {
			if (this.teamMembers[i].name == data.name) {
				this.teamMembers[i].online = true;
				teamUi.update(data.name, true);
				return;
			}
		}
	}
};

var sendMsg;
var videocall;

var receivedMessage = function(from, message) {
	var w = msgWindows.open(from);
	w.win.renderNewIncomingMessage({from: from, msg: message});
}

var _socket;

window.addEventListener("load", function () {

	console.log("something happening");

	var socket = io.connect(config_socketio_server);

	_socket = socket;

	Auth.loginReq = function(user, pass) {

		console.log("Auth req sent.", user, pass);

		socket.emit("authenticate", {user: user, password: pass});
	}

	socket.on("auth_done", function(data) {
		if (data.ok === true) {
			console.log("Authenticated", data);
			Auth.loginRes(data);
		} else {
			console.log("Authentication failed.");
		}
	});

	socket.on("cp:clipboard", function(data) {
		console.log("cp:clipboard received", data);
	});

	socket.on("message", function(data) {
		receivedMessage(data.from, data.message);
	});

	socket.on("groupMessage", function(data) {
		console.log("groupMessage", data);
	});

	socket.on("memberDisconnected", function(data) {
		console.log("memberDisconnected", data);
		Auth.setOffine(data);
	});

	socket.on("memberConnected", function(data) {
		console.log("memberConnected", data);
		Auth.setOnline(data);
	});

	sendMsg = function(to, message) {

		console.log("sending message", to, message);
		socket.emit("sendMsg", {to: to, msg: message});

	};

	document.getElementById("loginForm").addEventListener("submit", function(e) {
		e.preventDefault();

		var user = document.getElementById("username").value;
		var pass = document.getElementById("password").value;

		Auth.loginReq(user, pass);
	});

	console.log("Ready to roll.");
});
