import { Message, PeerTubeXMPPClient, User } from "peertube-livechat-xmpp";

export abstract class Trigger {
	name: string;
	aliases: string[];
	message: boolean;
	presence: boolean;

	constructor(name: string, message: boolean, presence: boolean, aliases: string[] = []) {
		this.name = name;
		this.message = message;
		this.presence = presence;
		this.aliases = aliases;
	}

	abstract handleMessage(args: string[], message: Message, client: PeerTubeXMPPClient): void | Promise<void>;
	abstract handlePresence(oldUser: User | undefined, newUser: User, client: PeerTubeXMPPClient): void | Promise<void>;
}

export class TriggerManager {
	prefix: string;
	triggers = new Map<string, Trigger>();

	constructor(prefix = "!") {
		this.prefix = prefix;
	}

	add(trigger: Trigger) {
		this.triggers.set(trigger.name, trigger);
		if (trigger.aliases.length)
			trigger.aliases.forEach(alias => this.triggers.set(alias, trigger));
	}

	async handleMessage(message: Message, client: PeerTubeXMPPClient) {
		const args = message.body.split(/s+/);
		const first = args.shift()!;
		if (first.startsWith(this.prefix)) {
			const name = first.slice(this.prefix.length);
			const trigger = this.triggers.get(name);
			if (trigger?.message)
				await trigger.handleMessage(args, message, client);
		}
	}

	async handlePresence(oldUser: User | undefined, newUser: User, client: PeerTubeXMPPClient) {
		for (const trigger of this.triggers.values()) {
			if (trigger.presence)
				await trigger.handlePresence(oldUser, newUser, client);
		}
	}
}