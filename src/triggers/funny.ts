import { Message } from "peertube-livechat-xmpp";
import { Trigger, TriggerFlag } from "../managers/trigger";

export class FunnyTrigger extends Trigger {
	cooldowns = new Set<string>();
	feathers = 10;

	constructor() {
		super("funny", TriggerFlag.MESSAGE);
	}

	async handleMessage(message: Message) {
		const body = message.body.toLowerCase();
		// fuck -> fsck
		if (body.includes("fuck") && Math.random() < 0.33) await message.reply(`Did you mean "fsck"?`);
		// loss -> | || || |_
		if (body.includes("loss") && !this.cooldowns.has("loss")) {
			this.cooldowns.add("loss");
			setTimeout(() => this.cooldowns.delete("loss"), 240000);
			await message.reply("loss? ~~:.|:;~~");
		}
		// 69 -> nice
		if (body.includes("69") && !this.cooldowns.has("nice")) {
			this.cooldowns.add("nice");
			setTimeout(() => this.cooldowns.delete("nice"), 30000);
			await message.reply("nice");
		}
		// :> -> :yay:
		if (body.includes(":>") && !this.cooldowns.has("yay")) {
			this.cooldowns.add("yay");
			setTimeout(() => this.cooldowns.delete("yay"), 60000);
			await message.reply(":yay:");
		}
		// inking -> inkling
		const match = body.match(/[\w-]*inking(?!\w)/i);
		if (match && match[0])
			await message.reply(`you mean "${match[0].replace("inking", "inkling")}"? :wink:`);
		// mo
		if (body.match(/give\s+(.*)\s+a\s+mo/i))
			await message.reply("🪶");
	}
}