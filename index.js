const puppeteer = require('puppeteer');
const fs        = require('fs');
const bk        = require('./bk.js');
const logic     = require('./logic.js');
const logger    = require('./logger.js');

async function main()
{
	const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
	const page = await browser.newPage();
	page.setViewport({width: 1200, height: 1000});
	bk.setPuppeteerPage(page);
	await bk.authorize();
	const balance  = await bk.getBalance();

	// проверить все не сыгранные матчи на сыгранность
	let currentBets =  await bk.getMyBets();
	logic.updateCurrentBetsStatuses(currentBets);

	let hasUnfinished = logic.hasUnfinishedMatches();
	if(!hasUnfinished)
	{
		// выбрать и поставить ставку
		// записать в файл ставку со статусом wait
		let liveMatches = await bk.getLiveMathches();
		let bet         = logic.selectBet(liveMatches);
		let nextSumm    = logic.getNextBetSum(bet.factor);

		await bk.makeBet(bet.button,nextSumm);
		logic.addBetToCatch(bet,nextSumm);
	}

	await browser.close();
}

// выбираем ставки от 2х до 2.5

try
{
	main();
}
catch (err)
{
	logger.error(err);
}



