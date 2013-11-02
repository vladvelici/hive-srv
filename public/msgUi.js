var msgUi = function (elem, person, sendCallback) {
	this.element = elem;
	this.elementId = elem.id;
	this.person = person;
	this.sendCallback = sendCallback;

	this.renderLayout();
}

msgUi.prototype.renderLayout = function() {
	var that = this;

	var sendForm = document.createElement("form");
	sendForm.id = this.elementId + "_sendForm";
	sendForm.className = "sendForm";

	var sendBox = document.createElement("input");
	sendBox.id = this.elementId + "_sendBox";
	sendBox.className = "sendBox";

	sendForm.onsubmit = function(e) {
		e.preventDefault();
		// that.sendCallback(sendBox.value);
		// sendForm.reset();
	}

	sendBox.onkeypress = function(e) {
		if (e.keyCode === 13) {
			that.sendCallback(sendBox.value);
			that.renderNewOutgoingMessage({from: "me", msg: sendBox.value});
			sendForm.reset();
		}
	}

	var msgBox = document.createElement("div");
	msgBox.id = this.elementId + "_msgBox";
	msgBox.className = "msgBox";

	this.sendForm = sendForm;
	this.sendBox = sendBox;
	this.msgBox = msgBox;

	this.element.appendChild(msgBox);
	sendForm.appendChild(sendBox);
	this.element.appendChild(sendForm);
	this.element.className = "imBox";
};

msgUi.prototype.renderMessageObj = function(msg) {
	var msgDom = document.createElement("div");

	var sender = document.createElement("span");
	sender.className = "sender";
	sender.appendChild(document.createTextNode(msg.from));

	var message = document.createElement("span");
	message.className = "actualMessage";
	message.appendChild(document.createTextNode(msg.msg));

	msgDom.appendChild(sender);
	msgDom.appendChild(message);

	return msgDom;
};

msgUi.prototype.renderNewIncomingMessage = function(msg) {
	var msgDom = this.renderMessageObj(msg);
	msg.className = "incomingMessage";
	this.msgBox.appendChild(msgDom);
	this.fixScroll();
};

msgUi.prototype.renderNewOutgoingMessage = function(msg) {
	var msgDom = this.renderMessageObj(msg);
	msg.className = "incomingMessage";
	this.msgBox.appendChild(msgDom);
	this.fixScroll();
};

msgUi.prototype.fixScroll = function() {
	this.element.scrollTop = this.element.scrollHeight;
}

var msgWindows = {
	_store: {},

	open: function(name) {
		if (this._store[name] === undefined) {
			// open it
			this._create(name);
			this._store[name].dom.style.display = "block";
			this._store[name].opened = true;
		} else {
			// show it
			this._store[name].dom.style.display = "block";
			this._store[name].opened = true;
		}

		return this._store[name];
	},

	close: function(name) {
		if (this._store[name] !== undefined) {
			this._store[name].dom.style.display = "none";
			this._store[name].opened = false;
		}
	},

	_create: function(name) {
		var dom = document.createElement("div");
		dom.id = "imBox-"+name;

		var that = this;

		var titl = document.createElement("div");
		titl.className = "imBoxTitleBar";
		var closebtn = document.createElement("a");
		closebtn.href = "javascript:void(0)";
		closebtn.onclick = function() {
			that.close(name);
		};

		closebtn.appendChild(document.createTextNode("x"));

		titl.appendChild(closebtn);

		titl.appendChild(document.createTextNode(name));

		dom.appendChild(titl);

		var win = new msgUi(dom, name, function(msg) {
			sendMsg(name, msg);
		});

		this._store[name] = {
			dom: dom,
			win: win,
			opened: true
		};

		document.body.appendChild(dom);
	}

}