import { JID } from "@xmpp/jid";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { PeerTubeXMPPClient } from "peertube-livechat-xmpp";

export class ChannelPointManager {
	readonly channelPointDir: string;
	readonly anonFile: string;
	readonly accountFile: string;

	anon = new Map<string, number>(); // nickname -> points
	account = new Map<string, number>(); // occupant id -> points
	private timeout?: NodeJS.Timeout;

	constructor(dataDir: string) {
		this.channelPointDir = path.join(dataDir, "channel-points");
		this.anonFile = path.join(this.channelPointDir, "anon.json");
		this.accountFile = path.join(this.channelPointDir, "account.json");

		if (existsSync(this.channelPointDir)) {
			if (existsSync(this.anonFile)) {
				const json = JSON.parse(readFileSync(this.anonFile, "utf8"));
				for (const [nickname, points] of Object.entries(json))
					this.anon.set(nickname, points as number);
			}
			if (existsSync(this.accountFile)) {
				const json = JSON.parse(readFileSync(this.accountFile, "utf8"));
				for (const [occupantId, points] of Object.entries(json))
					this.anon.set(occupantId, points as number);
			}
		} else
			mkdirSync(this.channelPointDir);
	}

	save() {
		let json: Record<string, number> = {};
		for (const [nickname, points] of this.anon.entries())
			json[nickname] = points;
		writeFileSync(this.anonFile, JSON.stringify(json));
		for (const [occupantId, points] of this.account.entries())
			json[occupantId] = points;
		writeFileSync(this.accountFile, JSON.stringify(json));
	}

	start(client: PeerTubeXMPPClient) {
		const recursiveTimeout = () => {
			this.timeout = setTimeout(() => {
				this.timeout = undefined;
				for (const user of client.users.values()) {
					if (this.account.has(user.occupantId)) {
						// If occupant ID exists, use it
						this.account.set(user.occupantId, this.account.get(user.occupantId)! + 5);
					} else if (user.jid) {
						// Check JID to see if user is anon or account
						const jid = user.jid as JID;
						if (jid.domain == client.data.localAnonymousJID) {
							// Anonymous user
							this.anon.set(user.nickname, 5);
						} else {
							// Account user
							this.account.set(user.occupantId, 5);
						}
					} else if (this.anon.has(user.nickname)) {
						// If nickname exists, use it
						this.anon.set(user.nickname, this.anon.get(user.nickname)! + 5);
					} else {
						// No data, default to use nickname
						this.anon.set(user.nickname, 5);
					}
				}
				this.save();

				recursiveTimeout();
			}, 50000);
		};

		recursiveTimeout();
	}

	stop() {
		if (this.timeout)
			clearTimeout(this.timeout);
	}
}