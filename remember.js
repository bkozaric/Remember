const Discord = require("discord.js");
const bot = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const fs = require("fs");

require('dotenv/config')

const token = process.env.BOT_TOKEN;

let rawdata = fs.readFileSync('saved.json');
var saved = JSON.parse(rawdata);

let lastPinnedUserId;

const PIN_CID = process.env.PIN_CID;
const GENERAL_CID = process.env.GENERAL_CID;
const BOT_UID = process.env.BOT_UID;
const UNDEFINED_NAME = "Bez naziva";

const forbidden = ["save last", "save help", "save pinned", "🗒️"];
const oneToNine = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

let messagesToRemoveIDs = [];

let EDIT_MID;
let pinnedEmbeds = []
let pinnedEmbedsPage = 0;
let lastPinnedMessageLink;

let deleteInitiated = false;

//const numberEmoji = {"0️⃣":0,"1️⃣":1,"2️⃣":2,"3️⃣":3,"4️⃣":4,"5️⃣":5,"6️⃣":6,"7️⃣":7,"8️⃣":8,"9️⃣":9};

bot.on("ready", () => {
    bot.user.setActivity("save help");
    console.log("I'm alive ...");
})

bot.on("message", async (message) => {
    if (message.channel.id == PIN_CID) {
        let filter = m => m.author.id == lastPinnedUserId;
        var noviNaziv = UNDEFINED_NAME;

        let kanal = bot.channels.cache.get(GENERAL_CID);
        kanal.send("**Upiši naziv novog pina**\n`Imaš 40 sekundi. Default naziv je: " + UNDEFINED_NAME + ". Naziv možeš promjeniti kasnije.`").then((firstReply) => {
            messagesToRemoveIDs.push(firstReply.id);
            kanal.awaitMessages(filter, { max: 1, time: 40000, errors: ['time'] })
                .then(collected => {

                    noviNaziv = collected.first().content;

                    messagesToRemoveIDs.push(collected.first().id);

                    kanal.send("Pinu je dodjeljen naziv: **" + noviNaziv + "**").then((imsg) => imsg.delete({ timeout: 5000 })); // SECOND

                    if (noviNaziv == UNDEFINED_NAME) {
                        console.log("Nista nije upisano"); // FIRST
                    }
                    else {
                        let nowDate = new Date();
                        saved[message.id] = {
                            id: message.id,
                            link: `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
                            original: lastPinnedMessageLink,
                            vrijeme: `${nowDate.getDate()}.${nowDate.getMonth() + 1}.${nowDate.getFullYear()} u ${nowDate.getHours()}:${nowDate.getMinutes() < 10 ? "0" + nowDate.getMinutes() : nowDate.getMinutes()}`,
                            name: noviNaziv
                        };
                        let data = JSON.stringify(saved);
                        fs.writeFileSync('saved.json', data);
                    }

                    deleteMessages(kanal);
                })
                .catch(collected => {
                    kanal.send("Ništa nije upisano. Pinu je dodjeljen naziv: *" + noviNaziv + "*").then((imsg) => imsg.delete({ timeout: 5000 })); // SECOND

                    if (noviNaziv == UNDEFINED_NAME) {
                        console.log("Nista nije upisano. Poruci je dodjeljen naziv: " + UNDEFINED_NAME); // FIRST
                    }
                    else {
                        let nowDate = new Date();
                        saved[message.id] = {
                            id: message.id,
                            link: `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
                            original: lastPinnedMessageLink,
                            vrijeme: `${nowDate.getDate()}.${nowDate.getMonth() + 1}.${nowDate.getFullYear()} u ${nowDate.getHours()}:${nowDate.getMinutes() < 10 ? "0" + nowDate.getMinutes() : nowDate.getMinutes()}`,
                            name: noviNaziv
                        };
                        let data = JSON.stringify(saved);
                        fs.writeFileSync('saved.json', data);
                    }

                    deleteMessages(kanal);
                });

        });
    }
    if (message.type === "PINS_ADD") {
        if (message.channel.id != PIN_CID) {
            message.channel.messages.fetch(message.reference.messageID).then(msgToSave => {
                message.delete();
                msgToSave.unpin();
                //console.log(`https://discordapp.com/channels/${msgToSave.guild.id}/${msgToSave.channel.id}/${msgToSave.id}`);
                lastPinnedMessageLink = `https://discordapp.com/channels/${msgToSave.guild.id}/${msgToSave.channel.id}/${msgToSave.id}`;
                lastPinnedUserId = message.author.id;
                saveMessage(msgToSave);
            })
                .catch(console.log)
        }
    }
    else {
        if (message.content == "save pinned" || message.content == "🗒️") {

            message.delete();

            pinnedEmbeds = []

            var embedCount = 0;
            var fieldCounter = 0;

            pinnedEmbeds.push(new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setAuthor('Remember', 'http://icons.iconarchive.com/icons/designbolts/free-multimedia/512/Film-icon.png/')
                .setTimestamp()
                .setFooter('Remember', 'http://icons.iconarchive.com/icons/designbolts/free-multimedia/512/Film-icon.png'));
            for (var key in saved) {
                if (fieldCounter == 10) {
                    fieldCounter = 0;
                    embedCount++;
                    pinnedEmbeds.push(new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setAuthor('Remember', 'http://icons.iconarchive.com/icons/designbolts/free-multimedia/512/Film-icon.png/')
                        .setTimestamp()
                        .setFooter('Remember', 'http://icons.iconarchive.com/icons/designbolts/free-multimedia/512/Film-icon.png'));
                }
                if (saved.hasOwnProperty(key)) {
                    var nazivPinaEmbed = saved[key].name;
                    var linkPinaEmbed = saved[key].link;
                    var ogLink = saved[key].original;
                    if (ogLink) {
                        pinnedEmbeds[embedCount].addField(saved[key].vrijeme, `${fieldCounter}. [${nazivPinaEmbed}](${linkPinaEmbed}) -> [Original](${ogLink})`);
                    }
                    else {
                        pinnedEmbeds[embedCount].addField(saved[key].vrijeme, `${fieldCounter}. [${nazivPinaEmbed}](${linkPinaEmbed})`);
                    }
                    fieldCounter++;
                }
            }
            message.channel.send(pinnedEmbeds[0].setTitle(`Spremljeni pinnovi [1/${embedCount + 1}]`)).then((testMessage) => {
                if (embedCount > 0) {
                    testMessage.react("⬅️");
                    testMessage.react("➡️");
                }
                testMessage.react("❌");
                testMessage.react("🗑️");
                EDIT_MID = testMessage.id;
            }).catch(console.error);

        }
        else if (message.content == "vrijeme") {
            /*
            let rawdataOld = fs.readFileSync('backupSaved.json');
            var savedOld = JSON.parse(rawdataOld);
            let newSaved = {};
            for(var key in savedOld){
                //console.log(key);
                await bot.channels.cache.get(PIN_CID).messages.fetch(key).then((pMsg) =>
                    {
                        //console.log()
                        newSaved[key] = {id:key,
                            link: savedOld[key].split(":")[1].trim() + ":" + savedOld[key].split(":")[2],
                            vrijeme: `${pMsg.createdAt.getDate()}.${pMsg.createdAt.getMonth() + 1}.${pMsg.createdAt.getFullYear()} u ${pMsg.createdAt.getHours()}:${pMsg.createdAt.getMinutes() < 10 ? "0" + pMsg.createdAt.getMinutes() : pMsg.createdAt.getMinutes()}`,
                            name: savedOld[key].split(":")[0]
                            };
                    }
                ).catch(console.error);
                
            }
            let newdata = JSON.stringify(newSaved);
            fs.writeFileSync('saved.json', newdata);
            */
        }
        else {
            var splitMsg = message.content.split(' ');
            if (splitMsg[0] == "save") {

                if (splitMsg.length >= 2) {
                    var urlReg = /https:\/\/discordapp\.com\/channels\/(\d+)\/(\d+)\/(\d+)/gm
                    var urlExec = urlReg.exec(splitMsg[1])

                    if (urlExec != null) {
                        var gid = urlExec[1];
                        var cid = urlExec[2];
                        var mid = urlExec[3];

                        if (gid.toString() == message.guild.id.toString()) {
                            bot.channels.cache.get(cid).messages.fetch(mid).then(msgToSave => {

                                lastPinnedUserId = message.author.id;
                                lastPinnedMessageLink = `https://discordapp.com/channels/${msgToSave.guild.id}/${msgToSave.channel.id}/${msgToSave.id}`;
                                saveMessage(msgToSave);

                                message.channel.send("Poruka uspješno spremljena. Link poruke: " + splitMsg[1]);

                            }).catch(console.error);
                        }
                        else {
                            message.channel.send("ID servera poruke koju želiš spremit se ne poklapa sa ID-em ovog servera.")
                        }

                    }
                    else {
                        if (splitMsg[1] == "last") {
                            message.channel.messages.fetch({ limit: 1, before: message.id }).then(messages => {
                                msgToSave = messages.first();
                                lastPinnedUserId = message.author.id;
                                lastPinnedMessageLink = `https://discordapp.com/channels/${msgToSave.guild.id}/${msgToSave.channel.id}/${msgToSave.id}`;
                                saveMessage(msgToSave);
                                message.channel.send("Prethodna poruka uspješno spremljena.")

                            });
                        }
                        else {
                            if (splitMsg[1] == "help") {
                                message.channel.send("Upute za korištenje naredbe **save**\n```\n" +
                                    "\n\nsave last - sprema prethodnu poruku\n\nsave <linkPoruke> - sprema poruku koja se nalazi na navedenom linku\n\n" +
                                    "save pinned - prikazuje popis spremljenih poruka sa pripadajucim naslovima```\n• Poruke je također moguće spremit **pinanjem** ili dodavanjem reacta :pushpin:  - \\:pushpin: na poruku koju želiš spremiti." +
                                    "\n• Za promjenu naziva postojećih pinova dodaj react 💬  - \\:speech_balloon: na pin čiji naziv želiš promjeniti."
                                );
                            }
                            else {
                                message.channel.send("Za pomoć oko korištenja naredbe *save* upiši *save help*");
                            }
                        }
                    }
                }
            }
        }
    }
})

bot.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            return;
        }
    }
    if (reaction.emoji.name == "📌") {
        if (reaction.message.channel.id != PIN_CID) {
            lastPinnedUserId = user.id;
            var msgToSave = reaction.message;
            reaction.message.reactions.removeAll();
            saveMessage(msgToSave);
        }
        else {
            reaction.message.reactions.removeAll();
            console.log("Ne mozes pinat vec pinano stari moj");
        }
    }
    else if (reaction.emoji.name == "💬") {
        if (reaction.message.channel.id == PIN_CID) {
            let noviNaziv = UNDEFINED_NAME;
            let filter = m => m.author.id == user.id;

            reaction.message.reactions.removeAll();
            let kanal = bot.channels.cache.get(GENERAL_CID);
            kanal.send("**Upiši novi naziv za postojeći pin**\n`Imaš 40 sekundi. Ako vrijeme istekne, pinu ostaje isti naziv.`").then((firstReply) => {
                messagesToRemoveIDs.push(firstReply.id);
                kanal.awaitMessages(filter, { max: 1, time: 40000, errors: ['time'] })
                    .then(collected => {
                        kanal.send("Pinu je dodjeljen naziv: **" + collected.first().content + "**").then((imsg) => imsg.delete({ timeout: 5000 })); // SECOND
                        noviNaziv = collected.first().content;
                        messagesToRemoveIDs.push(collected.first().id);

                        if (noviNaziv == UNDEFINED_NAME) {
                            console.log("Nista nije upisano"); // FIRST
                        }
                        else {
                            //saved[reaction.message.id] = noviNaziv + ": https://discordapp.com/channels/" + reaction.message.guild.id + "/" + reaction.message.channel.id + "/" + reaction.message.id;
                            saved[reaction.message.id].name = noviNaziv;;

                            let data = JSON.stringify(saved);
                            fs.writeFileSync('saved.json', data);
                        }
                        deleteMessages(kanal);
                    })
                    .catch(collected => {
                        kanal.send("Ništa nije upisano. Pinu ostaje naziv: **" + saved[reaction.message.id].name).then((imsg) => imsg.delete({ timeout: 5000 })); // SECOND

                        if (noviNaziv == UNDEFINED_NAME) {
                            console.log("Nista nije upisano. Poruci ostaje isti naziv."); // FIRST
                        }
                        deleteMessages(kanal);
                    });
            });
        }
    }
    else if (reaction.emoji.name == "⬅️") {
        if (user.id != BOT_UID) {
            if (reaction.message.id == EDIT_MID) {
                if (pinnedEmbedsPage - 1 >= 0) {
                    pinnedEmbedsPage--;
                    reaction.message.edit(pinnedEmbeds[pinnedEmbedsPage].setTitle(`Spremljeni pinnovi [${pinnedEmbedsPage + 1}/${pinnedEmbeds.length}]`));
                }
                else {
                    pinnedEmbedsPage = pinnedEmbeds.length - 1;
                    reaction.message.edit(pinnedEmbeds[pinnedEmbedsPage].setTitle(`Spremljeni pinnovi [${pinnedEmbedsPage + 1}/${pinnedEmbeds.length}]`));
                }
                await reaction.users.remove(user);
            }
        }
    }
    else if (reaction.emoji.name == "➡️") {
        if (user.id != BOT_UID) {
            if (reaction.message.id == EDIT_MID) {
                if (pinnedEmbedsPage + 1 < pinnedEmbeds.length) {
                    pinnedEmbedsPage++;
                    reaction.message.edit(pinnedEmbeds[pinnedEmbedsPage].setTitle(`Spremljeni pinnovi [${pinnedEmbedsPage + 1}/${pinnedEmbeds.length}]`));
                }
                else {
                    pinnedEmbedsPage = 0;
                    reaction.message.edit(pinnedEmbeds[pinnedEmbedsPage].setTitle(`Spremljeni pinnovi [${pinnedEmbedsPage + 1}/${pinnedEmbeds.length}]`));
                }
                await reaction.users.remove(user);
            }
        }
    }
    else if (reaction.emoji.name == "❌") {
        if (user.id != BOT_UID) {
            if (reaction.message.id == EDIT_MID) {
                EDIT_MID = "";
                reaction.message.delete().catch(console.error);
            }
        }
    }
    else if (reaction.emoji.name == "🗑️") {
        if (user.id != BOT_UID) {
            if (reaction.message.id == EDIT_MID) {
                //await reaction.message.reactions.removeAll().catch(console.error);
                //await reaction.message.react("❌");
                await reaction.users.remove(user);
                let filter = m => m.author.id == user.id;
                reaction.message.channel.send("\n\n🗑️ **Upiši broj pina kojeg želiš obrisati**").then((nMsg) => {
                    reaction.message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] })
                        .then(collected => {
                            if (oneToNine.includes(collected.first().content)) {
                                collected.first().delete().catch(console.error);
                                let keysArray = Object.keys(saved);
                                let kaIndex = pinnedEmbedsPage * 10 + parseInt(collected.first().content);
                                if (kaIndex < keysArray.length) {
                                    console.log(saved[keysArray[kaIndex]].name);
                                    reaction.message.channel.send("Pin uspješno obrisan s popisa - **" + saved[keysArray[kaIndex]].name + `**\nPoruku možeš ručno obrisati iz kanala ovdje: <${saved[keysArray[kaIndex]].link}>`).then((iMsg) => iMsg.delete({ timeout: 10000 }));
                                    delete saved[keysArray[kaIndex]];
                                    let data = JSON.stringify(saved);
                                    fs.writeFileSync('saved.json', data);
                                    pinnedEmbedsPage = 0;
                                }
                                else {
                                    reaction.message.channel.send("**Upisao si previsoki broj.** *Prekidam proces birsanja!*");
                                }

                            }
                            else {
                                reaction.message.channel.send("**Nisi upisao broj.** *Prekidam proces birsanja!*");
                            }
                        }).catch(console.error)
                    nMsg.delete({ timeout: 15000 }).catch(console.error);
                });


                //Object.keys(numberEmoji).forEach((emKey) => reaction.message.react(emKey).catch(console.error));
                /*let breakOut = false;
                for(const emKey in numberEmoji){
                    reaction.message.react(emKey).catch(() => {breakOut = true;});
                    if(breakOut){
                        break;
                    }
                }
                */
                //console.log(`Page: ${pinnedEmbedsPage}`);
            }
        }
    }
    /*
    else if(Object.keys(numberEmoji).includes(reaction.emoji.name)){
        if(user.id != BOT_UID){
            if(reaction.message.id == EDIT_MID){
                if(deleteInitiated){
                    deleteInitiated = false;
                    //console.log(`ID: ${pinnedEmbedsPage*10 + numberEmoji[reaction.emoji.name]}`);
                    let keysArray = Object.keys(saved);
                    let kaIndex = pinnedEmbedsPage*10 + numberEmoji[reaction.emoji.name];

                    if(kaIndex < keysArray.length){
                        reaction.message.delete().catch(console.error);
                        reaction.message.channel.send("Pin uspješno obrisan - **" + saved[keysArray[kaIndex]].name + "**");
                        delete saved[keysArray[kaIndex]];
                        let data = JSON.stringify(saved);
                        fs.writeFileSync('saved.json', data);
                    }
                    else{
                        console.log("Ovaj ne postoji");
                    }


                    //console.log(typeof saved);
                }
            }
        }
    }
    */
});

const saveMessage = (msgToSave) => {
    if (msgToSave.attachments.size != 0) {
        var attUrl = msgToSave.attachments.first().url;
        bot.channels.cache.get(PIN_CID).send(new Discord.MessageAttachment(attUrl));
    }
    else {
        if (!forbidden.includes(msgToSave.content)) {
            bot.channels.cache.get(PIN_CID).send(msgToSave.content);
        }
        else {
            console.log("Zabranjena rijec!");
        }
    }
}

const deleteMessages = (kanal) => {
    for (var i = 0; i < messagesToRemoveIDs.length; i++) {
        kanal.messages.fetch(messagesToRemoveIDs[i]).then(dMsg => dMsg.delete()).catch(console.error);
    }
    messagesToRemoveIDs = [];
}

bot.login(token);