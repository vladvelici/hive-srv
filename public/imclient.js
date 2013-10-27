console.log("file loaded");
var Auth = {
	user: null,
	loginReq: null,
	loginRes: function(data) {
		this.user = data.me;
		this.teamMembers = data.team; 
	}
};

var sendMsg;

window.addEventListener("load", function () {

	console.log("something happening");

	var socket = io.connect(config_socketio_server);

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

	socket.on("message", function(data) {
		console.log("received message", data);
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

	document.getElementById("sendMsgForm").addEventListener("submit", function(e) {
		e.preventDefault();

		var to = document.getElementById("msg_to").value;
		var txt = document.getElementById("msg_txt").value;

		sendMsg(to, txt);
	})

	console.log("Ready to roll.");
});
