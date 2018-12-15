// Stable Release
const Discord = require('discord.js');
const client = new Discord.Client();
const sql = require('sqlite');
sql.open('./sunucular.sqlite'); // Create the database!!

let lastDate = [];

const commands = {
	'komutlar': (msg) => {
	  msg.channel.send({embed: {
			title: 'Yardım paneli',
			description: `Prefix: #!`,
			fields: [
			{
				name: 'davet',
				value: 'Botun davet linkini alırsınız.',
				inline: true
			},
			{
				name: 'kbelirle',
				value: 'Reklam kanalını belirler.',
				inline: true
			},
			{
				name: 'bilgi',
				value: 'Reklamındaki bilgi kutucuğunu düzenler.',
				inline: true
			},
			{
				name: 'örnek',
				value: 'Reklamının benzerini gösterir.',
				inline: true
			},
			{
				name: 'gönder',
				value: 'Reklamını bütün kanallara gönderir.',
				inline: true
			},
			]
		}});
	},
	'davet': (msg) => {
		sendEmbed(msg, msg.guild.id, msg.channel.id, 'Davet linki: [link](https://discordapp.com/api/oauth2/authorize?client_id=518326323769507853&permissions=8&scope=bot).');
	},
	'gönder': (msg) => {
		const now = new Date();
		let cooldown = (5 * 60 * 1000);
		if (lastDate[msg.guild.id] === undefined){
			lastDate[msg.guild.id] = 0;
		}
    if (now - lastDate[msg.guild.id] > cooldown) {
      // It's been more than 10 mins
			let desc = null;
			sql.all('SELECT * FROM settings').then(row => {
				msg.guild.channels.first().createInvite().then(invite => {
					for (let i = 0; i < row.length; i++){
						let guild = client.guilds.get(row[i].guildid);
						
						for (let a = 0; a < row.length; a++){
							let temp = client.guilds.get(row[a].guildid);
							if (temp){
								if (temp.id === msg.guild.id){
									if (!msg.guild.channels.has(row[a].partner)){
										sendEmbed(msg, msg.guild.id, msg.channel.id, `İlk önce kbelirle komutunu kullanarak kanal ayarlamalısın!`);
										lastDate[msg.guild.id] = 0;
										return;
									}
									desc = row[a].desc;
									break;
								}
							}
						}
						
						if (desc === undefined || desc === null){
							lastDate[msg.guild.id] = 0;
							return sendEmbed(msg, msg.guild.id, msg.channel.id, `${msg.guild.name} adlı kanalın bilgisi yok, lütfen ayarla.`);
						}
						if (guild){
							if (guild.channels.has(row[i].partner) && guild.id !== msg.guild.id){
								let str = [
									`__**${msg.guild.name}**__`,
									`${desc} ${invite.url}`
								];
								guild.channels.get(row[i].partner).send(str.join('\n\n'));
							}
						}
					}
					sendEmbed(msg, msg.guild.id, msg.channel.id, `Reklamın **${row.length - 1}** sayıda sunucuda yapıldı.`);
				});
			});
      lastDate[msg.guild.id] = now;
    } else {
      // It's been less than 10 mins
			let remaining = Math.round(((cooldown) - (now - lastDate[msg.guild.id]))/1000);
			sendEmbed(msg, msg.guild.id, msg.channel.id, `Uyarı! **${remaining} saniye** beklemelisin.`);
    }
	},
	'kbelirle': (msg) => {
		if (!msg.member.hasPermission('ADMINISTRATOR')){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Yönetici olmalısın!');
		}
		const args = msg.content.slice(tokens.prefix.length).trim().split(/ +/g).slice(1);
		if (args[0] === undefined){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Lütfen kanal seç.');
		}
		let channel = client.guilds.get(msg.guild.id).channels.find('name', args[0]);
		if (channel){
			sql.run('UPDATE settings SET partner = ? WHERE guildid = ?', [channel.id, msg.guild.id]);
			sendEmbed(msg, msg.guild.id, msg.channel.id, 'Kanal ayarlandı.');
		} else {
			sendEmbed(msg, msg.guild.id, msg.channel.id, 'Geçersiz kanal, lütfen # kullanmayın.');
		}
	},
	'bilgi': (msg) => {
		if (!msg.member.hasPermission('ADMINISTRATOR')){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Yönetici olmalısın!');
		}
		const string = msg.content.slice(tokens.prefix.length).trim().split(/ +/g).slice(1).join(' ');
		if (string === undefined || string === ''){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Lütfen bilgi belirle.');
		}
		if (string.length > 255){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Bilgi en fazla 255 karakter olmalı.');
		}
		if (string.length < 30){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Bilgi en az 30 harfli olmalı.');
		}
		if (string.includes('http') || string.includes('@everyone') || string.includes('@here')){
			return msg.channel.send('Lütfen link veya bahsetme kullanmayın.');
		}
		sql.run('UPDATE settings SET desc = ? WHERE guildid = ?', [string, msg.guild.id]);
		sendEmbed(msg, msg.guild.id, msg.channel.id, 'Güncellendi.');
	},
	'örnek': (msg) => {
		if (!msg.member.hasPermission('ADMINISTRATOR')){
			return sendEmbed(msg, msg.guild.id, msg.channel.id, 'Yönetici olmalısın!');
		}
		sql.get('SELECT * FROM settings WHERE guildid = ?', [msg.guild.id]).then(row => {
			let str = [
				`__**${msg.guild.name}**__`,
				`${row.desc} [Invite]`
			];
			
			msg.channel.send(str.join('\n\n'));
		});
	}
}

client.on('ready', () => {
	// We have connected!
	client.user.setActivity('Sunucunuzdaki artan kitleyi', { type: 'WATCHING' });
  console.log(`${client.user.tag} aktif! ${client.guilds.size} Sunucuda ve ${client.users.size} kişi ile birlikteyim.`);
	// Create the tables if they do not exist.ee
	sql.run('CREATE TABLE IF NOT EXISTS settings (guildid TEXT UNIQUE, partner CHARACTER, desc VARCHAR)').then(() => {
		for (const guild of client.guilds.values()){
			sql.run('INSERT OR IGNORE INTO settings (guildid) VALUES (?)', [guild.id]);
		}
	});
});

client.on('guildCreate', (guild) => {
	console.log(`Beni bir sunucu daha ekledi :) : ${guild.name}`);
	sql.run('INSERT OR IGNORE INTO settings (guildid) VALUES (?)', [guild.id]);
});

client.on('guildDelete', (guild) => {
	console.log(`Beni bir sunucudan daha ayrıldım :( : ${guild.name}`);
	sql.run('DELETE * FROM settings WHERE guildid = ?', [guild.id]);
});

client.on('message', async msg => {
	// Handle the bot and channel type.
	if (msg.author.bot) return; // We don't want the bot reacting to itself..
	if (msg.channel.type !== 'text') return; // Lets focus on the use of text channels.
	
	if (msg.content.startsWith("#!" + "ping")){
		const m = await msg.channel.send("Ping?");
		m.edit(`Pong! Pingim: ${m.createdTimestamp - msg.createdTimestamp}ms. Yanıt verme sürem: ${Math.round(client.ping)}ms.`);
		return;
	}
	
	// Handle Commands Module
	if (!msg.content.startsWith("#!")) return; // The start of commands.
	console.log(`[${msg.guild.name}] ${msg.author.tag} >> ${msg.content}`); // Log commands.
	const cmd = msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]; //Grab the command.
	if (commands.hasOwnProperty(cmd)){ // Check to see if commands has the command.
		commands[cmd](msg); // Push the cmd to the commands object.
	}
});

function sendEmbed(msg, guildid, channelid, str){
	const embed_object = {
		embed: {
			description: str,
			color: 0xffc4f9
		}
	}
	
	if (!msg.channel.permissionsFor(client.user).has('EMBED_LINKS')){
		return msg.channel.send('EMBED_LINKS yetkisine ihtiyacım var.');
	}
	
	if (!msg.channel.permissionsFor(client.user).has('MANAGE_MESSAGES')){
		return msg.channel.send('MANAGE_MESSAGES yetkisine ihtiyacım var.');
	}
	
	let guild = client.guilds.get(guildid);
	
	guild.channels.get(channelid).send(embed_object).then(m => {
		
	});
}

client.login("process.env.token");
