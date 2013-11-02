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
}

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

exports.user = User;
exports.store = UserStore;