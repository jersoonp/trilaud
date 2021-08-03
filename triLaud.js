"use strict";
const { ChatClient } = require("dank-twitch-irc");
const player = require("node-wav-player");
const df = require("date-fns");
const fs = require("fs");
const os = require("os");
const conf = require("./config.js").trilaud_config;
const ptl = console.log;
const ptlw = console.warn;
const joinDelay = 580; //in ms, max 20 joins per 10 seconds. 
let channels = [];
let activechannels = [];

process.on("SIGUSR1", ReloadChannels);
try{
	fs.writeFileSync("./pid", process.pid);
}
catch(err){
	ptlw(`<error> Unable to write pid to file: ${err}`);
}

ptl(`<startup> TriLaud v0.1 starting up at ${gftime()}`);
ptl(`<startup> System: ${os.platform} @ ${os.hostname}, node version: ${process.versions.node}, v8 version: ${process.versions.v8}`);

if(conf.pingsound==="")
	ptlw(`<warn> pingsound setting is empty in config.js. No sound will be played when you get pinged`);
if(conf.giftsound==="")
	ptlw(`<warn> giftsound setting is empty in config.js. No sound will be played when you get a gift`);

const client = new ChatClient({username: conf.username, password: conf.oauth});
client.on("connecting", onConnecting);
client.on("connect", onConnect);
client.on("ready", onReady);
client.on("close", onClose);
client.on("error", onError);
client.on("PRIVMSG", incomingMessage);
client.on("USERNOTICE", onUserNotice);
client.on("RECONNECT", onReconnect);

function onReconnect(){
	ptl(`<cc> TMI requested reconnect, reconnecting...`);
}

function onConnecting(){
	ptl(`<cc> Connecting to TMI`);
}
function onConnect(){
	ptl(`<cc> Connected!`);
	ptl(`<cc> Logging in...`);
}

function onReady(){
	ptl(`<cc> Logged in! Chat module ready.`);
	JoinChannels();
}

function onClose(){
	ptlw(`<cc> Connection to TMI was closed.`);
}
function onError(inErr){
	ptl(`<cc> Chatclient error detected: ${inErr}`);
	if (inErr.name==="CapabilitiesError" || inErr.name==="LoginError"){
		ptl(`<cc> Capability error or login error detected, cannot continue. Terminating application.`);
		process.exit(1);
	}
	if(inErr.name==="ReconnectError"){
		ptl(`<cc> Twitch requested us to reconnect, but there was an error doing so: ${inErr}`);
		ptl(`<cc> Restarting application as a safety measure`);
		process.exit(0);
	}
}

async function onUserNotice(inMsg){
	if(inMsg.isSubgift() || inMsg.isAnonSubgift()){
		if (inMsg.eventParams.recipientUsername.toLowerCase() === conf.username.toLowerCase()){
			ptl(`[${gftime()}] PagMan YOU GOT A GIFT IN #${inMsg.channelName} FROM ${inMsg.displayName || 'an anonymous gifter!'}`);
			if(conf.giftsound.length>0){
				try { await player.play({path: conf.giftsound}); }
				catch(err){
					ptlw(`<soundplayer> Gift sound playback failed: ${err}`);
				}
			}
		}
		else {
			ptl(`[${gftime()}] ${inMsg.displayName || 'An anonymous gifter'} gifted a sub to ${inMsg.eventParams.recipientUsername} in #${inMsg.channelName}`);
		}
	}
}

async function incomingMessage(inMsg){
	if(!conf.alertOnPings) return;
	let sender 	= inMsg.senderUsername.toLowerCase();
	let message = String(inMsg.messageText);
	let channel = inMsg.channelName;
	const rx = new RegExp(conf.username, "i");
	if(rx.test(message) && sender!=conf.username){
		ptl(`[${gftime()}] ${sender} pinged you in #${channel}: ${message}`);
		if(conf.pingsound.length>0){
			try { await player.play({path: conf.pingsound}); }
			catch(err){
				ptlw(`<soundplayer> Ping sound playback failed: ${err}`);
			}
		}
	}
}

client.connect();

function gftime(){
	return df.format(new Date, "yyyy-MM-dd HH:mm:ss");
}

function LoadChannels(inFile){
	let buff, inch, le, rv=0;
	try{
		buff = fs.readFileSync(inFile);
	}
	catch(err){
		ptlw(`<error> LoadChannels: unable to read ${inFile}: ${err}`);
		return -1;
	}
	if(buff.length<3){
		ptlw(`<warn> channels.txt is empty or contains no valid channel adata`);
		return -1;
	}
	buff = buff.toString();
	switch(detectLineEndings(buff)){
		case "CR":
			le = "\r";
			break;
		case "LF":
			le = "\n";
			break;
		case "CRLF":
			le = "\r\n";
			break;
		case "NONE":
			le = " ";
			break;
		default:
			//NaM
			break;
	}
	buff = buff.split(le);
	for(let b of buff){
		inch = b.trim().toLowerCase();
		if(inch.length<3) continue;
		if(channels.findIndex(c=> c===inch) !== -1){
			//ptl(`<loadchannels> Channel ${inch} is already in the array, skipping`);
		} else {
			channels.push(inch);
			rv++;
		}
	}
	return rv;
}

async function JoinChannels(){
	let isfailed=0, stime, ptime;
	LoadChannels("channels.txt");
	for(let c of channels){
		if(activechannels.findIndex(ac => ac === c)===-1){
			isfailed = 0;
			stime = new Date;
			try { await client.join(c); }
			catch(err){
				ptlw(`<error> Error while trying to join ${c}: ${err}`);
				isfailed=1;
			}
			finally{
				if(!isfailed){
					ptl(`Successfully joined channel ${c}`);
					activechannels.push(c);
					ptime = joinDelay-(new Date - stime);
					if(ptime>0) await sleep(ptime);
				}
			}
		}
	}
}

function ReloadChannels(){
	ptl(`[${gftime()}] Received SIGUSR1, reloading channels`);
	JoinChannels();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function detectLineEndings(inTxt){
	const cr	= inTxt.split("\r").length;
	const lf	= inTxt.split("\n").length;
	const crlf	= inTxt.split("\r\n").length;
	
	if(cr+lf===0) return "NONE";
	if(cr === crlf && lf === crlf) return "CRLF";
	if(cr>lf) return "CR";
	else return "LF";
}

