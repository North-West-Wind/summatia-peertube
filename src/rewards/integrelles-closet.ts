import { appendFileSync, existsSync, readFileSync } from "fs";
import { Reward } from "../triggers/redeem";

const IPC_FILE = "/home/northwestwind/.config/Firebot/ipc.txt";
const STATES_FILE = "/home/northwestwind/.config/Firebot/states.json";

export class IntegrellesClosetReward extends Reward {
	constructor() {
		super("integrelles-closet", 11, { short: "intclo", description: "Change the look of Integrelle.", cooldown: 15 * 60 });
	}

	redeem() {
		// Read from my Firebot state file
		if (existsSync(STATES_FILE)) {
			try {
				const { hidden, activeIntegrelleCloset } = JSON.parse(readFileSync(STATES_FILE, "utf8"));
				if (hidden || activeIntegrelleCloset) return false;
			} catch (err) { }
		}
		// Write to my Firebot IPC file
		appendFileSync(IPC_FILE, this.name);
		return true;
	}
}