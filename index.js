const fs = require('fs');
const data = fs.readFileSync('data.json');
const db = JSON.parse(data);
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.ENVTOKEN;
const rp = require('request-promise');
const cheerio = require('cheerio');



const bot = new TelegramBot(token, {polling: true});


bot.onText(/\/adduser (.+)/, (msg, match) => {
	const chatId = msg.chat.id;
	const resp = match[1];
 // Should add an OBJ to the parsed json that contains the chatid and push the match to an array of users

checkUsername(resp).then((data) => {
 	if (data) {
		bot.sendMessage(chatId, `O usuário ${resp} não está disponível`);
	} else {
		bot.sendMessage(chatId, `O usuário ${resp} está disponível`);
	}
})
 	addName(resp, chatId)


});

function addName (name, chatId) {

	const found = db.users.some(obj => obj["chatId"] === chatId);

	if (!found) {
		db.users.push({
		chatId: chatId,
		username: name
		})
		console.log("Not Found!");
		fs.writeFile('data.json', JSON.stringify(db), 'utf-8', function(err) {
		if (err) throw err
		console.log("Done!")
	})
	} else { console.log("Found"); }
}

function checkUsername(username) {
	const options = {
		uri: `https://t.me/${username}`,
		transform: body => {
		return cheerio.load(body);
		}
	};

	return rp(options).then(($) => {

		const hasUser = $(".tgme_page_extra").length;
		return hasUser;
	})
	.catch((err) => {
		console.log(err);
	});

};
