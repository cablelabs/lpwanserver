
"use strict";

var db = require('../lib/db.js');

const logInterval = 60; //minutes
var log={
	startTime: new Date().toISOString(),
	//endTime: 0,
	lpwanRecords: {},
	appRecords: {}
};

function logger() {
	//log.endTime = Date.now();

	//output record for lpwan log
	var record = {time: log.startTime, host: '', id: '', msgs: 0, bytes: 0};
	for(var i in log.lpwanRecords) {
		record.host = i;
		for(var j in log.lpwanRecords[i]) {
			record.id = j;
			record.msgs = log.lpwanRecords[i][j].msgs;
			record.bytes = log.lpwanRecords[i][j].bytes;
			db.insertLogEntry("lpwanLog", record)
				.then((r) => console.log(r))
				.catch((e) => console.log(e));
			//console.log("Log: " + JSON.stringify(record));

		}
	}

	//output record for app log
	record = {time: log.startTime, id: '', msgs: 0, bytes: 0};
	for(var i in log.appRecords) {
		record.id = i;
		record.msgs = log.appRecords[i].msgs;
		record.bytes = log.appRecords[i].bytes;
		db.insertLogEntry("applicationLog", record)
			.then((r) => console.log(r))
			.catch((e) => console.log(e));

		//console.log("Log: " + JSON.stringify(record));
	}

	log.startTime = new Date().toISOString();
	log.appRecords = {};
	log.lpwanRecords= {};
	setTimeout(logger, logInterval*60*1000);
}

setTimeout(logger, logInterval*60*1000);

exports.logLpwanMsg = function(host, id, bytes) {
	if(log.lpwanRecords[host] == undefined) {
		log.lpwanRecords[host] = {};
	}
	if(log.lpwanRecords[host][id] == undefined) {
		log.lpwanRecords[host][id] = {bytes: 0, msgs: 0};
	}

	log.lpwanRecords[host][id].bytes += bytes;
	log.lpwanRecords[host][id].msgs += 1;
}

exports.logAppMsg = function(id, bytes) {
	if(log.appRecords[id] == undefined) {
		log.appRecords[id] = {bytes: 0, msgs: 0};
	}

	log.appRecords[id].bytes += bytes;
	log.appRecords[id].msgs += 1;
}
	
