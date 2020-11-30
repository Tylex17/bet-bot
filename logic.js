const fs     = require('fs');
const logger = require('./logger.js');
module.exports =
{
	betStep: 40,
	catchFile: (__dirname + '/last.json'),
	/**
	 * catch format
	 * [
	 * 	 {mathch}
	 * ]
	 */
	getCatch()
	{
		try {
			return require(this.catchFile);
		} catch (e) {
			return [];
		}
	},

	addBetToCatch(bet,summ)
	{
		let catchMatches = this.getCatch();
		let curTime = new Date();

		let day = (curTime.getMonth()+1);

		catchMatches.push({
			status : 'wait',
			summ   : summ,
			factor: bet.factor,
			time   : this.getFormattedDatePart(curTime.getHours()) + ':' + this.getFormattedDatePart(curTime.getMinutes()),
			date   : this.getFormattedDatePart(curTime.getDate()) + '.' + this.getFormattedDatePart((curTime.getMonth()+1))
		});
		fs.writeFile(this.catchFile, JSON.stringify(catchMatches), 'utf8', (err) => {
			if (err)
			{
				logger.error('[addBetToCatch] Bet not added to catch:', err);
				throw err;
			}
		});
	},

	getFormattedDatePart(part)
	{
		return ((part < 10) ? ("0" + part) : part);
	},

	/**
	 * Если есть хотя бы один матч со статусом wait - то ждем
	 */
	hasUnfinishedMatches()
	{
		let catchMatches = this.getCatch();

		let hasUnfinished = false;
		for(let match of catchMatches)
		{
			if(match.status != 'wait')
				continue;
			hasUnfinished = true;
			break;
		}
		return hasUnfinished;
	},

	updateCurrentBetsStatuses(currentBets)
	{
		let fileMatches = this.getCatch();
		for(let fileMatch of fileMatches)
		{
			if(fileMatch.status != 'wait')
				continue;
			for(let curBet of currentBets)
			{
				if(curBet.date != fileMatch.date || curBet.time != fileMatch.time)
					continue;

				// выйграли - все ок
				if(curBet.result == 'win')
				{
					fileMatches = [];
					break;
				}

				// проиграли
				if(curBet.result != 'inProgress')
				{
					fileMatch.status = curBet.result;
					break;
				}

			}
		}

		fs.writeFile(this.catchFile, JSON.stringify(fileMatches), 'utf8', (err) => {
			if (err)
			{
				logger.error('[addBetToCatch] Bet not added to catch:', err);
				throw err;
			}
		});
	},

	/**
	 * @return { object } bet
	 */
	selectBet(matches)
	{
		for(let match of matches)
		{
			for(let bet of match.bets)
			{
				if(bet.factor > 1.8 && bet.factor < 2.2)
					return bet;
			}
		}
		return false;
	},

	getNextBetSum(factor)
	{
		let catchMatches = this.getCatch();
		let loseSum = 0;
		for(let match of catchMatches)
		{
			if(match.status == 'lose')
				loseSum += match.summ;
		}
		let nextBetSumm = Math.round((loseSum + this.betStep)/(factor - 1));
		return nextBetSumm;
	}
}