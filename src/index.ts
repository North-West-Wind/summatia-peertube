import "dotenv/config";
import { existsSync, mkdirSync, readFileSync } from "fs";
import * as path from "path";
import { PeerTubeXMPPClient } from "peertube-livechat-xmpp";
import { ChannelPointManager } from "./managers/channel-points";
import { TriggerManager } from "./managers/trigger";
import { TimerManager } from "./managers/timer";

const DATA_DIR = process.env.DATA_DIR || "data";
mkdirSync(DATA_DIR, { recursive: true });
const REFRESH_TOKEN_FILE = path.join(DATA_DIR, "rtoken.txt");

const refreshToken = existsSync(REFRESH_TOKEN_FILE) ? readFileSync(REFRESH_TOKEN_FILE, "utf8") : undefined;
const client = new PeerTubeXMPPClient("peertube.wtf", process.env.ROOM_ID!, {
	refreshToken,
	refreshTokenFile: REFRESH_TOKEN_FILE,
	credentials: {
		username: process.env.USERNAME!,
		password: process.env.PASSWORD!
	}
});

const channelPointManager = new ChannelPointManager(DATA_DIR);
const triggerManager = new TriggerManager();
const timerManager = new TimerManager();

// Module initialization
// Import modules here to prevent circular imports
import { BrellaRateTimer } from "./timers/brella-rate";
import { BrellaTrigger } from "./triggers/brella";
triggerManager.add(new BrellaTrigger());
timerManager.add(new BrellaRateTimer(client));

client.on("ready", () => {
	console.log(`${client.users.self?.nickname} is ready!`);
	channelPointManager.start(client);
	timerManager.start();
});

client.on("message", async message => {
	// Ignore self
	if (message.authorId == client.users.self?.occupantId) return;
	// Handle triggers
	await triggerManager.handleMessage(message, client);
});

client.on("presence", async (oldUser, newUser) => {
	// Ignore self
	if (newUser.occupantId == client.users.self?.occupantId) return;
	// Handle triggers
	await triggerManager.handlePresence(oldUser, newUser, client);
});