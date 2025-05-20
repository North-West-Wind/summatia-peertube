export type BrellaAnalytics = {
	firstRecord: string;
	totalGames: number;
	totalBrellas: number;
	ourBrellas: number;
	otherBrellas: number;
	specifics: {
		spygadget: number;
		spygadget_sorella: number;
		parashelter: number;
		parashelter_sorella: number;
		order_shelter_replica: number;
		campingshelter: number;
		campingshelter_sorella: number;
		brella24mk1: number;
		brella24mk2: number;
	};
	lastBattleId: string;
}

const sharedData: {
	brellaAnalytics?: BrellaAnalytics;
	brellaToday?: { brellas: number, games: number };
} = {};

export default sharedData;