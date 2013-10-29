console.log("file loaded");

var Auth = {
	user: null,
	loginReq: null,
	teamMembers: [],

	loginRes: function(data) {
		this.user = data.me;
		this.teamMembers = data.team;

		document.getElementById("loginForm").parentNode.appendChild(document.createTextNode(data.me.name));
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
var sendGroupMsg;
var videocall;

var receivedMessage = function(from, message) {
	var w = msgWindows.open(from);
	w.win.renderNewIncomingMessage({from: from, msg: message});
}

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

	sendGroupMsg = function(to, message) {

		console.log("sending message", to, message);
		socket.emit("sendGroupMsg", {to: to, msg: message});

	};

	document.getElementById("loginForm").addEventListener("submit", function(e) {
		e.preventDefault();

		var user = document.getElementById("username").value;
		var pass = document.getElementById("password").value;

		Auth.loginReq(user, pass);
	});

	videocall = {
		pc: null,
		awaitingAnswer: false,
		videoStream: null,
		localVidEl: null,
		remoteVidEl: null,

		initVideo: function() {
			this.localVidEl = document.getElementById('localVideoEl');
			this.remoteVidEl = document.getElementById('removeVideoEl');
			var that = this;
			navigator.getUserMedia({video: true, audio: true}, function(stream) {
				that.videoStream = stream;
				
			})
		},

		call: function(name) {
			this.pc = new RTCPeerConnection(null);
			var that = this;

			this.pc.createOffer(function(desc) {
				that.pc.setLocalDescription(desc);
				that.awaitingAnswer = name;
				socket.emit("initVideo", {to: name, rtcReq: desc});
			});
		},

		sendAnswer: function(name, rtcReq) {
			if (this.pc === null)
				this.pc = new RTCPeerConnection(null);

			var that=this;

			this.pc.setRemoteDescription = rtcReq;

			this.pc.createAnswer(function(desc) {
				that.pc.setLocalDescription = desc;
				socket.emit("answerVideo", {to: name, rtcRes: desc});
			});

		}

		gotAnswer: function(name, rtcRes) {
			if (this.awaitingAnswer !== name) {
				return;
			}

			this.pc.setRemoteDescription(rtcRes);

			this.awaitingAnswer = false;
		}
	}


	socket.on("incomingCall", function(data) {
		var answer = confirm("Incoming call from " + data.from + "\nAnswer?");
		if (answer === false) return;

		videocall.sendAnswer(data.from, data.rtcReq);
	});

	socket.on("answerCall", function(data) {
		gotAnswer(data.from, data.rtcRes);
	});

	console.log("Ready to roll.");
});
