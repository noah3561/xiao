const Command = require('../../structures/Command');
const request = require('node-superfetch');
const { list, today, tomorrow } = require('../../util/Util');
const { GOOGLE_KEY, GOOGLE_CALENDAR_ID, PERSONAL_GOOGLE_CALENDAR_ID } = process.env;

module.exports = class HolidaysCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'holidays',
			aliases: ['google-calendar', 'holiday', 'calendar', 'events'],
			group: 'events',
			memberName: 'holidays',
			description: 'Responds with today\'s holidays.'
		});
	}

	async run(msg) {
		try {
			const events = [];
			const standardEvents = await this.fetchHolidays(GOOGLE_CALENDAR_ID);
			if (standardEvents) events.push(...standardEvents);
			const personalEvents = await this.fetchHolidays(PERSONAL_GOOGLE_CALENDAR_ID);
			if (personalEvents) events.push(...personalEvents);
			if (!events.length) return msg.say('There are no events today...');
			return msg.say(`Today's ${events.length === 1 ? 'event is' : `${events.length} events are`}: ${list(events)}.`);
		} catch (err) {
			return msg.reply(`Oh no, an error occurred: \`${err.message}\`. Try again later!`);
		}
	}

	async fetchHolidays(id) {
		try {
			const { body } = await request
				.get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`)
				.query({
					maxResults: 20,
					orderBy: 'startTime',
					singleEvents: true,
					timeMax: tomorrow().toISOString(),
					timeMin: today().toISOString(),
					timeZone: 'UTC',
					key: GOOGLE_KEY
				});
			if (!body.items.length) return null;
			return body.items.map(holiday => holiday.summary);
		} catch (err) {
			if (err.status === 404) return null;
			throw err;
		}
	}
};
