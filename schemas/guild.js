const {Schema, model} = require("mongoose");
const {defaultPrefix} = require('../bot/configs.js');

const guildSchema = new Schema({
	_id: String,
	actionlogs: {
		type: new Schema({
			newchannel: String,
			editchannel: String,
			delchannel: String,
			editmsg: String,
			delmsg: String,
			newemoji: String,
			editemoji: String,
			delemoji: String,
		}),
		default: () => ({}),
	},
	modlogs: {
		type: new Schema({
			warn: String,
			mute: String,
			kick: String,
			ban: String,
		}),
		default: () => ({}),
	},
	muteRoleID: String,
	prefix: {
		type: String,
		default: defaultPrefix,
	},
	autoSetupMute: {
		type: Boolean,
		default: true,
	},
	globalBan: Boolean,
	dmInfo: Boolean,
	pruneBan: Boolean,
	maxMute: {
		type: Number,
		default: 10080,
	},
	gainExp: Boolean,
	language: {
		type: String,
		required: true,
	},
	beta: Boolean,
    counterLogs: {
        type: Number,
        default: 0,
    },
    counterMenus: {
        type: Number,
        default: 0,
    },
});

module.exports = model("guild", guildSchema);