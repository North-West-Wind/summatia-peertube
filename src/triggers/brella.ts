import { Message, PeerTubeXMPPClient } from "peertube-livechat-xmpp";
import { roundTo } from "../helpers/math";
import { Trigger } from "../managers/trigger";
import sharedData from "../shared";

export class BrellaTrigger extends Trigger {
	constructor() {
		super("brella", true, false);
	}

	async handleMessage(_args: string[], _message: Message, client: PeerTubeXMPPClient) {
		if (!sharedData.brellaAnalytics || !sharedData.brellaToday) {
			await client.message("no brella data yet");
			return;
		}
		const analytics = sharedData.brellaAnalytics;
		const today = sharedData.brellaToday;
		let body = `today: ${roundTo(today.brellas / today.games, 2)} brellas/game (${today.brellas}/${today.games})\n`;
		body += `counting from ${analytics.firstRecord}\n`;
		body += `- ${roundTo(analytics.totalBrellas / analytics.totalGames, 2)} brellas/game (${analytics.totalBrellas}/${analytics.totalGames})\n`;
		body += `- ${analytics.ourBrellas} (me) vs ${analytics.otherBrellas} (them)\n`;
		const specifics = analytics.specifics;
		body += `- [${specifics.spygadget}, ${specifics.spygadget_sorella}, ${specifics.parashelter}, ${specifics.parashelter_sorella}, ${specifics.order_shelter_replica}, ${specifics.campingshelter}, ${specifics.campingshelter_sorella}, ${specifics.brella24mk1}, ${specifics.brella24mk2}]\n`;
		body += "(order: v/s under, v/s/order brella, v/s tent, recycled I/II)\n";
		body += "https://brella.northwestw.in";
		await client.message(body);
	}

	// No presence effect
	handlePresence() { }
}