const fs = require('fs');
const data = fs.readFileSync('data.json');
const db = JSON.parse(data);
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.ENVTOKEN;
const rp = require('request-promise');
const cheerio = require('cheerio');
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/add (.+)/, (msg, match) => {
	const chatId = msg.chat.id;
	const username = match[1].replace('@','');;
	checkUsername(username).then((hasUser) => {
		if (hasUser) {
			addName(username, chatId);
			bot.sendMessage(chatId, `@${username} is now being monitored`);
		} else {
			bot.sendMessage(chatId, `@${username} is already available, you can only monitor usernames that are not available.`);
		}
	})
});

bot.onText(/\/remove (.+)/, (msg, match) => {
	const chatId = msg.chat.id;
	const username = match[1].replace('@','');;
	removeName(username, chatId);
});

function addName (name, chatId) {
	const userObj = db.users.find(obj => obj.chatId === chatId);

	if (userObj === undefined) {
		db.users.push({
		chatId: chatId,
		username: [name]
		})
		console.log("Not Found!");
		fs.writeFile('data.json', JSON.stringify(db), 'utf-8', error => { if (error) throw error })
	} else if (!userObj.username.includes(name)) {
		userObj.username.push(name);
		fs.writeFile('data.json', JSON.stringify(db), 'utf-8', error => { if (error) throw error })
		console.log("Found, pushed")
	}
}

function removeName(username, chatId) {
	const userObj = db.users.find(obj => obj.chatId === chatId);

	if (!userObj === undefined && userObj.username.includes(username)) {
		 userObj.username.splice(userObj.username.indexOf(username), 1);
		 fs.writeFile('data.json', JSON.stringify(db), 'utf-8', error => { if (error) throw error })
		 bot.sendMessage(chatId, `@${username} is no longer being monitored`);

	} else {
		 bot.sendMessage(chatId, `This user is not currently being monitored, use /add @${username} to start monitoring this username`);
	}

}

function checkUsername(username) {
	const options = {
		uri: `https://t.me/` + username,
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


function routine() {
	db.users.forEach(userObj => {
	userObj.username.forEach(username => {
		checkUsername(username).then(hasUser => {
		if(!hasUser) {
			bot.sendMessage(userObj.chatId, `‼️ Username @${username} is now AVAILABLE ‼️`);
			removeName(username, userObj.chatId);

		};

		})
	})
});
}

setInterval(routine, 1800000);

bot.on('polling_error', (error) => {
	console.log(error.code);  // => 'EFATAL'
});
