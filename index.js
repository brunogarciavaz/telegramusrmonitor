const fs = require('fs');
const data = fs.readFileSync('data.json');
const db = JSON.parse(data);
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.ENVTOKEN;
const rp = require('request-promise');
const cheerio = require('cheerio');
const bot = new TelegramBot(token, {polling: true});
const http = require('http');
const express = require('express');
const app = express();


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userObj = db.users.find(obj => obj.chatId === chatId);
  if (userObj === undefined) {
    db.users.push({
    chatId: chatId,
    username: []
    })
    console.log("User Not Found! Creating");
    fs.writeFile('data.json', JSON.stringify(db), 'utf-8', error => { if (error) throw error })
  }
  bot.sendMessage(chatId, `Welcome! \nUse /add @example to start monitoring an username. \nUse /remove @example to stop monitoring an username \nWhen available, the bot will warn you and stop monitoring the username.`);

});

bot.onText(/\/add (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace('@','');;
  checkUsername(username).then((hasUser) => {
    if (hasUser) {
      addName(username, chatId);
    } else {
      bot.sendMessage(chatId, `@${username} is already available, you can only monitor usernames that are not available.`);
    }
  }).catch(err => {
      bot.sendMessage(chatId, `Telegram Server Returned Error ${err.statusCode}.`)
      console.log(err);

    })
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace('@','');;
  removeName(username, chatId);
});

function addName (username, chatId) {
  const userObj = db.users.find(obj => obj.chatId === chatId);

   if (!userObj.username.includes(username)) {
    userObj.username.push(username);
    bot.sendMessage(chatId, `@${username} is now being monitored`);
    fs.writeFile('data.json', JSON.stringify(db), 'utf-8', error => { if (error) throw error })
    console.log("chatId Found, username pushed")
  } else bot.sendMessage(chatId, `@${username} is already being monitored`);
}

function removeName(username, chatId) {
  const userObj = db.users.find(obj => obj.chatId === chatId);

  if (userObj.username.includes(username)) {
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

	}).catch(err => {throw err} )

};


const interval = 30000;

function routine() {
  return Promise.all(db.users.map(userObj => {
    return Promise.all(userObj.username.map(username => {
      return checkUsername(username).then(hasUser => {
        if(!hasUser) {
  				//	bot.sendMessage(userObj.chatId, `‼️ Username @${username} is now AVAILABLE ‼️`)
					console.log("sim" + username);
					removeName(username, userObj.chatId);
          } else console.log("não" + username)
      })
        }
    ))
  })).then(function(){
    setTimeout(routine, interval);
  }, function(error){
    console.error(error);
    setTimeout(routine, interval);
  })
}

routine();


bot.on('polling_error', (error) => {
  console.log(error.code);  // => 'EFATAL'
});


app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
