import { Message } from "peertube-livechat-xmpp";
import { Trigger, TriggerFlag } from "../managers/trigger";
import { ChannelPointManager } from "../managers/channel-points";

export abstract class Reward {
	name: string;
	cost: number;
	short?: string;
	description?: string;
	requiredArgs: string[];
	optionalArgs: string[];
	cooldown: number;
	limit: number;

	onCooldown = false;
	reachedLimit = false;
	used = 0;

	constructor(name: string, cost: number, options: { short?: string, description?: string, requiredArgs?: string[], optionalArgs?: string[], cooldown?: number, limit?: number } = {}) {
		this.name = name;
		this.cost = cost;
		this.short = options.short;
		this.description = options.description;
		this.requiredArgs = options.requiredArgs || [];
		this.optionalArgs = options.optionalArgs || [];
		this.cooldown = options.cooldown || 0;
		this.limit = options.limit || 0;
	}

	abstract redeem(args: string[]): boolean | Promise<boolean>;

	async handleRedeem(args: string[]) {
		if (this.cooldown > 0) {
			this.onCooldown = true;
			setTimeout(() => this.onCooldown = false, this.cooldown * 1000);
		}
		this.used++;
		if (this.limit > 0 && this.used == this.limit)
			this.reachedLimit = true;
		return await this.redeem(args);
	}

	help() {
		const args = this.requiredArgs.map(arg => `<${arg}>`).concat(this.optionalArgs.map(arg => `[${arg}]`));
		return `[${this.cost}] ${this.name}${args.length ? ` ${args.join(" ")}` : ""}${this.description ? ` - ${this.description}` : ""}${this.short ? ` (alias: ${this.short})` : ""}`;
	}
}

export class RedeemTrigger extends Trigger {
	private channelPointManager: ChannelPointManager;
	private rewards: Map<string, Reward>;
	private rewardAliases: Map<string, Reward>;
	
	constructor(channelPointManager: ChannelPointManager) {
		super("redeem", TriggerFlag.COMMAND, ["r"]);
		this.channelPointManager = channelPointManager;
		this.rewards = new Map();
		this.rewardAliases = new Map();

		(async () => {
			// Dynamic import to avoid circular dependency
			const { CallSummatiaReward } = await import("../rewards/call-summatia");
			this.add(new CallSummatiaReward());
			const { IntegrellesClosetReward } = await import("../rewards/integrelles-closet");
			this.add(new IntegrellesClosetReward());
		})();
	}

	async handleCommand(args: string[], message: Message) {
		if (!args.length) {
			await message.reply(`use "!redeem <reward> [args]" to redeem something with your channel points!\n${this.listRewards()}`);
			return;
		}
		const first = args.shift()!;
		const reward = this.rewards.get(first) || this.rewardAliases.get(first);
		if (!reward) {
			await message.reply(`unknown reward! here are the available ones:\n${this.listRewards()}`);
			return;
		}

		if (reward.onCooldown) {
			await message.reply(`"${reward.name}" is currently on cooldown`);
			return;
		}

		if (reward.reachedLimit) {
			await message.reply(`"${reward.name}" has reached its limit`);
			return;
		}

		const author = message.author();
		if (!author) {
			await message.reply(`I don't know who you are :/ (ask NW for help)`);
			return;
		}
		if (!this.channelPointManager.deduct(author, reward.cost, true)) {
			await message.reply(`you don't have enough points!`);
			return;
		}
		const result = await reward.handleRedeem(args);
		if (!result) await message.reply("❌");
		else {
			this.channelPointManager.deduct(author, reward.cost);
			await message.reply("✅");
		}
	}

	private listRewards() {
		return Array.from(this.rewards.values())
			.map(reward => reward.help())
			.join("\n");
	}

	private add(reward: Reward) {
		this.rewards.set(reward.name, reward);
		if (reward.short) this.rewardAliases.set(reward.short, reward);
	}
}