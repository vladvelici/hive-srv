var teamUi = {

	_store: [],

	addTeamMembers: function (arr) {
		for (var i in arr) {
			this._store.push({
				name: arr[i].name,
				online: arr[i].online,
				dom: this._renderMemberDom(arr[i].name, arr[i].online)
			});
		}
	},

	update: function(name, online) {
		for (var i in this._store) {
			if (this._store[i].name === name) {
				var dom = this._store[i].dom;
				this._updateMemberDom(dom, online);
				this._store[i].online = online;
				return;
			}
		}
	},

	_container: null,

	_init: function(elId) {
		this._container = document.getElementById(elId);
	},

	_renderMemberDom: function(name, online) {
		var dom = document.createElement("div");
		dom.className = "person_" + (online ? "online" : "offline");
		dom.id = "person_" + name;

		dom.appendChild(document.createTextNode(name));

		dom.onclick = function() {
			msgWindows.open(name);
		};

		this._container.appendChild(dom);

		return dom;
	},

	_updateMemberDom: function(dom, online) {
		dom.className = "person_" + (online ? "online" : "offline");
	}
}

