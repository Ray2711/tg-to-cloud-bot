const { customAlphabet}= require('nanoid')
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8)
require('dotenv').config()
const fs = require('fs')
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const express = require('express')
const axios = require('axios')
const port = process.env.PORT||3000;
const site = process.env.LINK||`http://localhost:${port}`;

const download = async(url, id,name) => {return new Promise((resolve, reject) => {
    fs.mkdir(`./cloud/storage/${id}`, (e) => {if(e) console.log(`Error or something idk ${e}`)})
    axios({url, responseType: 'stream'}).then(response => {
            response.data.pipe(fs.createWriteStream(`./cloud/storage/${id}/${name}`))
                .on('finish', () => {resolve(`${site}/dl/${id}`);})
                .on('error', e => {console.log(e);resolve('error');})
            });
})}
//Express Server
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/dl/:id', async(req, res) =>{
    const dir = await fs.promises.opendir(`./cloud/storage/${req.params.id}`)
    const dirFile = await dir.read()
    const file = dirFile.name
    res.download(`./cloud/storage/${req.params.id}/${file}`); // Set disposition and send it.
    dir.close()
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
//

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Welcome! Start uploading!'));
bot.help((ctx) => ctx.reply('Send me any file, and i will turn it into a short downloadable link!'));
bot.on(message('document'), async (ctx) =>{
    if(!ctx.message.document.file_id) return;
    ctx.reply("Got file, uploading to a cloud")
    const id = nanoid()
    const url = await ctx.telegram.getFileLink(ctx.message.document.file_id)
    const res = await download(url,id,ctx.message.document.file_name)
    if(res==="error"){ return await ctx.reply("Error happened. Try again later.")}
    await ctx.reply(res);
})
bot.on(message('photo'), async (ctx) =>{
    if(!ctx.message.photo[ctx.message.photo.length-1].file_id) return;
    ctx.reply("Got photo, uploading to a cloud")
    const id = nanoid()
    const url = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length-1].file_id)
    const res = await download(url,id,ctx.message.photo[0].file_unique_id+".jpg")
    if(res==="error"){ return await ctx.reply("Error happened. Try again later.")}
    await ctx.reply(res);
})
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));