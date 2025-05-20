export abstract class Timer {
	time: number;
	func: () => void | Promise<void>;
	repeating: boolean;
	immediate: boolean;
	timeout?: NodeJS.Timeout;

	constructor(time: number, func: () => void | Promise<void>, repeating = true, immediate = true) {
		this.time = time;
		this.func = func;
		this.repeating = repeating;
		this.immediate = immediate;
	}

	start() {
		if (this.timeout)
			clearTimeout(this.timeout);

		this.timeout = setTimeout(() => {
			// Repeat first
			this.timeout = undefined;
			if (this.repeating)
				this.start();
			// Then execute function, so errors won't stop it
			this.func();
		}, this.time);

		if (this.immediate)
			this.func();
	}

	stop() {
		if (this.timeout)
			clearTimeout(this.timeout);
	}
}

export class TimerManager {
	timers: Timer[] = [];
	active = false;

	add(timer: Timer) {
		this.timers.push(timer);
		if (this.active) timer.start();
	}

	start() {
		this.active = true;
		this.timers.forEach(timer => timer.start());
	}

	stop() {
		this.active = false;
		this.timers.forEach(timer => timer.stop());
	}
}