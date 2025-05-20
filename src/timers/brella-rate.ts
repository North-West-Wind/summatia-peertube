import { PeerTubeXMPPClient } from "peertube-livechat-xmpp";
import { Timer } from "../managers/timer";
import fetch from "node-fetch";
import sharedData from "../shared";
import { roundTo } from "../helpers/math";

export class BrellaRateTimer extends Timer {
	brellaRate = NaN;

	constructor(client: PeerTubeXMPPClient) {
		super(30000, async () => {
			let res = await fetch("https://brella.northwestw.in/api/analytics");
			if (!res.ok) return;
			sharedData.brellaAnalytics = await res.json();
			res = await fetch("https://brella.northwestw.in/api/today");
			if (!res.ok) return;
			const today = await res.json();
			if (isNaN(this.brellaRate)) {
				// First ping, don't send
				this.brellaRate = today.brellas[20] / today.games[20];
			} else {
				this.brellaRate = today.brellas[20] / today.games[20];
				client.message(`today's brella rate: ${roundTo(this.brellaRate, 2)}`);
			}
			sharedData.brellaToday = { brellas: today.brellas[20], games: today.games[20] };
		});
	}
}