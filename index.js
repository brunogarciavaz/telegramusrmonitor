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
 // Should add a OBJ to the parsed json that contains the chatid and push the match to an array of users
 	if (checkUsername(match)) {
		bot.sendMessage(chatId, `O usuário ${match} não está disponível`);
	} else {
		bot.sendMessage(chatId, `O usuário ${match} está disponível`);
	}
 	addName (match, chatId)


});

function addName (name, chatId) {
	db.users.push({
	chatId: chatId,
	username: name

	})
}
function checkUsername(username) {
	const options = {
  uri: `https://t.me/` + username,
  transform: function (body) {
    return cheerio.load(body);
  }
	};
	rp(options)
	.then(($) => {
		let hasUser = $('.tgme_page_extra').length;
		return hasUser;
	})

	.catch((err) => {

	});

};
