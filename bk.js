module.exports = {
	puppeteerPage:false,
	setPuppeteerPage(puppeteerPage)
	{
		this.puppeteerPage = puppeteerPage;
	},

	async authorize()
	{
		await this.puppeteerPage.goto('https://www.fonbet.ru/');
		await this.puppeteerPage.waitFor(10000);
		const loginButton = await this.puppeteerPage.$('.header__login-head .header__link');
		await loginButton.click();

		await this.puppeteerPage.focus('.login-form__form-row .ui__field');
		this.puppeteerPage.keyboard.type('89993599394');

		await this.puppeteerPage.waitFor(1000);

		await this.puppeteerPage.focus('.login-form__form-row .ui__field[type="password"]');

		await this.puppeteerPage.waitFor(1000);


		const loginSubmitButton = await this.puppeteerPage.$('.toolbar__item .toolbar__btn[type="submit"]');
		await loginSubmitButton.click();
		await this.puppeteerPage.waitFor(1000);
	},
	async getBalance()
	{
		const balancePopup = await this.puppeteerPage.$('.ident-instruction-popup__icon-close--2SpnV');
		if(balancePopup)
		{
			balancePopup.click();
		}
		await this.puppeteerPage.waitFor(1000);
		const balance = await this.puppeteerPage.$eval('.header__login-balance', el => +el.innerText);
		return balance;

	},

	async goToLiveBetsPage()
	{
		await this.puppeteerPage.goto('https://www.fonbet.ru/#!/live');
		await this.puppeteerPage.waitFor(3000);
	},

	// формат возврощаемых данных
	// {gameName:'название',bets:[button,button,button]}
	async getLiveMathches()
	{
		await this.goToLiveBetsPage();
		await this.puppeteerPage.waitForSelector('.table__body .table__row');
		let matchesResult = [];
		const matchesLines = await this.puppeteerPage.$$('.table__body .table__row');
		for (let matchLine of matchesLines)
		{
			let resMatchObject = {};
			let matchLineTitle = await matchLine.$('.table__match-title');
			if(!matchLineTitle)
				continue;

			let matchLineTitleString = await matchLineTitle.evaluate(node => node.innerText);
			resMatchObject.gameName = matchLineTitleString;

			let betButtons = await matchLine.$$('._type_btn._type_normal');
			let resBets = [];
			for(let betButton of betButtons)
			{
				let betFactor = await betButton.evaluate(node => node.innerText);
				resBets.push({
					factor : parseFloat(betFactor),
					button : betButton
				});
			}

			resMatchObject.bets = resBets;
			matchesResult.push(resMatchObject);
			if(matchesResult.length > 20)
				break;
		}
		return matchesResult;
	},

	async makeBet(button, sum)
	{
		await button.click();
		await this.puppeteerPage.waitFor(1100);
		await this.puppeteerPage.keyboard.type(String(sum));
		await this.puppeteerPage.waitFor(1100);
		const betButton = await this.puppeteerPage.$('.button--54u30.normal-bet--3r-PV');
		await betButton.click();
		await this.puppeteerPage.waitFor(3000);
	},

	async getMyBets()
	{
		await this.puppeteerPage.goto('https://www.fonbet.ru/#!/account/history/bets');
		await this.puppeteerPage.waitFor(3000);
		let myBets = [];

		await this.puppeteerPage.waitForSelector('.bets-list__data .wrap');
		const bets = await this.puppeteerPage.$$('.bets-list__data .wrap');
		let lastDate = false;
		for (let bet of bets)
		{
			let betObject = {};

			let betDate = await bet.$('._hasDate');
			if(betDate)
				lastDate = await betDate.evaluate(node => node.innerText);
			betObject.date = lastDate;

			let betTime = await bet.$('.column-2');
			let betLineTime = await betTime.evaluate(node => node.innerText);
			betLineTime = betLineTime.split(':');
			betObject.time = betLineTime[0]+':'+betLineTime[1];

			let betId = await bet.$('.column-3');
			let betIdText = await betId.evaluate(node => node.innerText);
			betObject.id = betObject.date+betObject.time+betIdText;

			let betSum = await bet.$('.column-5 span');
			let betSumText = await betSum.evaluate(node => node.innerText);
			betObject.betSum = betSumText;

			let betResultString = await bet.$('.column-6 span');
			let betResult = await betResultString.evaluate(node => node.innerText);
			betObject.result = 'lose';
			if(betResult == 'Не рассчитана')
				betObject.result = 'inProgress';
			if(betResult == 'Выигрыш')
				betObject.result = 'win';

			myBets.push(betObject)
		}
		return myBets;
	}
}