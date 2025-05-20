import { appendFileSync, existsSync, readFileSync } from "fs";
import { Reward } from "../triggers/redeem";

const IPC_FILE = "/home/northwestwind/.config/Firebot/ipc.txt";
const STATES_FILE = "/home/northwestwind/.config/Firebot/states.json";

export class CallSummatiaReward extends Reward {
	constructor() {
		super("call-summatia", 5, { short: "calsum", cooldown: 7 * 60 });
	}

	redeem() {
		// Read from my Firebot state file
		if (existsSync(STATES_FILE)) {
			try {
				const { hidden, activeCallSummatia } = JSON.parse(readFileSync(STATES_FILE, "utf8"));
				if (hidden || activeCallSummatia) return false;
			} catch (err) { }
		}
		// Write to my Firebot IPC file
		appendFileSync(IPC_FILE, this.name);
		return true;
	}
}