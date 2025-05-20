import { Message, PeerTubeXMPPClient, User } from "peertube-livechat-xmpp";

export enum TriggerFlag {
	MESSAGE = 1,
	COMMAND = 2,
	PRESENCE = 4
}

export abstract class Trigger {
	name: string;
	aliases: string[];
	message: boolean;
	command: boolean;
	presence: boolean;

	constructor(name: string, flags: number, aliases: string[] = []) {
		this.name = name;
		this.message = !!(flags & TriggerFlag.MESSAGE);
		this.command = !!(flags & TriggerFlag.COMMAND);
		this.presence = !!(flags & TriggerFlag.PRESENCE);
		this.aliases = aliases;
	}

	async handleMessage(message: Message) {}
	async handleCommand(args: string[], message: Message) {}
	async handlePresence(oldUser: User | undefined, newUser: User) {}
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

	async handleMessage(message: Message) {
		for (const trigger of this.triggers.values()) {
			if (trigger.message)
				await trigger.handleMessage(message);
		}

		const args = message.body.split(/s+/);
		const first = args.shift()!;
		if (first.startsWith(this.prefix)) {
			const name = first.slice(this.prefix.length);
			const trigger = this.triggers.get(name);
			if (trigger?.message)
				await trigger.handleCommand(args, message);
		}
	}

	async handlePresence(oldUser: User | undefined, newUser: User) {
		for (const trigger of this.triggers.values()) {
			if (trigger.presence)
				await trigger.handlePresence(oldUser, newUser);
		}
	}
}