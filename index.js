const Discord = require("discord.js");
const bot = new Discord.Client();
const fetch = require("node-fetch");
const prefix = "!";
const config = require("./config");
const { Transform } = require("stream");
const googleSpeech = require("@google-cloud/speech");
const googleSpeechClient = new googleSpeech.SpeechClient();
GOOGLE_APPLICATION_CREDENTIALS="google.json";

const answer = [];
const question = [];

function convertBufferTo1Channel(buffer) {
  const convertedBuffer = Buffer.alloc(buffer.length / 2);

  for (let i = 0; i < convertedBuffer.length / 2; i++) {
    const uint16 = buffer.readUInt16LE(i * 4);
    convertedBuffer.writeUInt16LE(uint16, i * 2);
  }

  return convertedBuffer;
}

class ConvertTo1ChannelStream extends Transform {
  constructor(source, options) {
    super(options);
  }

  _transform(data, encoding, next) {
    next(null, convertBufferTo1Channel(data));
  }
}

function getUserFromMention(mention) {
  if (!mention) return;
  if (mention.startsWith("<@") && mention.endsWith(">")) {
    mention = mention.slice(2, -1);
    if (mention.startsWith("!")) {
      mention = mention.slice(1);
    }

    return bot.users.cache.get(mention);
  }
}

bot.on("ready", () => {
  console.log("bot is working");
});

bot.on("message", async (message) => {
  if (!message.guild) return;
  if (message.content === "/join") {
    if (message.member.voice.channel) {
      const connection = await message.member.voice.channel.join();
      const receiver = connection.receiver;
      connection.on("speaking", (user, speaking) => {
        if (speaking) {
          console.log(`Im listening to ${user.username}`);
          const audioStream = receiver.createStream(user, { mode: "pcm" });
          const requestConfig = {
            encoding: "LINEAR16",
            sampleRateHertz: 48000,
            languageCode: "ru-RU",  
          };
          const request = {
            config: requestConfig,
          };
          const recognizeStream = googleSpeechClient
            .streamingRecognize(request)
            .on("error", console.error)
            .on("data", (response) => {
              const transcription = response.results
                .map((result) => result.alternatives[0].transcript)
                .join("\n")
                .toLowerCase();
              if (transcription === "привет") {
                message.channel.send("Hello");
              } else if (transcription === "как дела") {
                message.channel.send("NORMALNO");
              } 
               else if (transcription === "кто такой юра") {
                message.channel.send("лучший парень во дворе");
              } else if (transcription === "что это за конфа") {
                message.channel.send("это конфа друзей и доброты!");
              } else if (transcription === "сколько будет 368 х 247") {
                message.channel.send("90896");
              } 
              else if(transcription === "ресурсы"){
                message.channel.send(`Книга You dont know JS  -  https://github.com/marryday/You-Dont-Know-JS \n
                Youtube канал Fun Fun Function  -  https://www.youtube.com/channel/UCO1cgjhGzsSYb1rsB4bFe4Q \n
                course-hunters react  https://coursehunter.net/course/react-js-s-nulya-do-professionala-polnyy-kurs \n
                course-hunters git https://coursehunter.net/course/polnoe-rukovodstvo-po-git-poymite-i-osvoyte-git-i-github \n`)
              }
              else if (transcription === 'функциональное программирование'){
                message.channel.send(`Если говорить простыми словами, то функциональное программирование — это способ программировать, при котором вы можете передавать функции в качестве параметров другим функциям, а также возвращать их как значения. В функциональном программировании мы думаем и пишем код с точки зрения функций.\n
                `)
              }
              else if (transcription === "генераторы") {
                message.channel
                  .send(`Обычные функции возвращают только одно-единственное значение (или ничего).

                Генераторы могут порождать (yield) множество значений одно за другим, по мере необходимости. Генераторы отлично работают с перебираемыми объектами и позволяют легко создавать потоки данных.\n
                https://learn.javascript.ru/generators\n`);
              } 
             else if (question.includes(transcription)) {
                const index = question.indexOf(transcription);
                console.log(question.indexOf(transcription));
                message.channel.send(answer[index]);
              }
              console.log(`Transcription: ${transcription}`);
            });

          const convertTo1ChannelStream = new ConvertTo1ChannelStream();

          audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream);

          audioStream.on("end", async () => {
            console.log("audioStream end");
          });
        } else {
          console.log(`I stopped listening to ${user.username}`);
        }
      });
    } else {
      message.reply("You need to join a voice channel");
    }
  }
});

bot.on("message", async (msg) => {
  if (msg.author.username === "LapkaVlasti") msg.react("💄");
  else if (msg.author.username === `Fi'WΣ`) {
    msg.react("👠");
    msg.react("338758498852536321");
  } else if (!msg.content.startsWith(prefix)) {
    return;
  }
  const args = msg.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLocaleLowerCase();
  console.log(args);
  console.log(command);

  if (command === "help") {
    msg.channel.send(
      "Приветики в этом чатике! \n\n!функции высшего порядка\n!filter - Array.prototype.filter()\n!map - Array.prototype.map()\n!reduce - Array.prototype.reduce()\n!ООП - Объектно ориентированное программирование\n!port - убить порт 3000\n\n!avatar @*username* - показать аватар пользователя\n!f - pay respect to @*username*\n!capslock - выводит сообщение капслоком\n\n!panda - рандомная пикча красной панды\n!fox - рандомная пикча лисы\n!meme - рандомный мем\n!joke - рандомная шутка\n\n /join пригласить бот в голосовой канал\nГолосовые команды:\nПривет\nКто такой юра\nФункциональное программирование\nГенераторы\nРесуры - полезные ресурсы по JS"
    );
  }
  if (command === "avatar") {
    if (args[0]) {
      // Change `getUserFromMention` to `getUserFromMentionRegEx` to try the RegEx variant.
      const user = getUserFromMention(args[0]);
      if (!user) {
        return msg.reply(
          "Please use a proper mention if you want to see someone else's avatar."
        );
      }
      return msg.channel.send(
        `${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}`
      );
    }
    return msg.channel.send(
      `${msg.author.username}, your avatar: ${msg.author.displayAvatarURL({
        dynamic: true,
      })}`
    );
  }
  if (command === "add") {
    if (args[0].startsWith('"')) {
      let i = 0;
      let result = "";
      while (!args[i].endsWith('"')) {
        result += ` ${args[i]}`;
        i++;
      }
      result += ` ${args[i]}`;
      let newResult = result.replace('"', "").replace(" ", "");

      question.push(newResult.replace('"', ""));
      let x = i + 1;
      let res = "";
      while (!args[x].endsWith('"')) {
        res += ` ${args[x]}`;
        x++;
      }
      res += ` ${args[x]}`;
      let newRes = res.replace('"', "").replace(" ", "");
      answer.push(newRes.replace('"', ""));
      console.log(question, answer);
    } else {
      question.push(args[0]);
      answer.push(args[1]);
      console.log(question, answer);
    }
  }
  if (command === "f") {
    if (args[0]) {
      const user = getUserFromMention(args[0]);
      if (!user) {
        return msg.reply(`Please use a proper mention`);
      }
      return msg.reply("paid respect for " + "<@!" + `${user.id}` + ">");
    }
    msg.channel.send(`${msg.author.username} paid respect for @${args[0]}`);
  }
  if (command === "port") {
    msg.channel.send("fuser -n tcp -k 3000");
  }
  if (command === "lenny") {
    msg.channel.send("( ͡° ͜ʖ ͡°)");
  }
  if (command === "функции" && args[0] === "высшего" && args[1] === "порядка") {
    msg.channel
      .send(`Такие функции оперируют другими функциями, принимая их в качестве аргументов или возвращая их. Проще говоря, функции высшего порядка ― это такие функции, которые принимают функцию в качестве аргумента или возвращают функцию в качестве вывода.
    \nНапример, эти функции высшего порядка встроены в язык: Array.prototype.map, Array.prototype.filter и Array.prototype.reduce .`);
  }
  if (command === "функциональное" && args[0] === "программирование") {
    msg.channel.send(
      `Если говорить простыми словами, то функциональное программирование — это способ программировать, при котором вы можете передавать функции в качестве параметров другим функциям, а также возвращать их как значения. В функциональном программировании мы думаем и пишем код с точки зрения функций.`
    );
  }
  if (command === "filter") {
    msg.channel.send(`Array.prototype.filter\n\nМетод filter() создаёт новый массив со всеми элементами, прошедшими проверку, задаваемую в передаваемой функции.`);
  }
  if (command === "reduce") {
    msg.channel.send(`Array.prototype.reduce\n\nМетод reduce выполняет callback-функцию для каждого элемента вызываемого массива, что в результате приводит к одному выходному значению. Метод reduce принимает два параметра: \n1) reducer-функцию (callback), \n2) и опционально initialValue.
    \nReducer-функция (callback) принимает 4 параметра: accumulator, currentValue, currentIndex, sourceArray.\nЕсли параметр initialValue предусмотрен, тогда accumulator будет равен initialValue , а currentValue равен первому элементу в массиве.\nЕсли параметр initialValue не предусмотрен, тогда accumulator будет равен первому элементу массива, а currentValue – второму.`);
  }
  if (command === "ооп") {
    msg.channel.send(
      `Объектно-ориентированное программирование (ООП) — это шаблон проектирования программного обеспечения, который позволяет решать задачи с точки зрения объектов и их взаимодействий. ООП обычно реализуется с помощью классов или прототипов. JavaScript реализует ООП через прототипное наследование.`
    );
  }
  if (command === "map") {
    msg.channel.send(`Array.prototype.map()\n\nМетод map() создаёт новый массив с результатом вызова указанной функции для каждого элемента массива.`);
  }
  if (command === "clear") {
    let num = 2;
    if (args[0]) {
      num = parseInt(args[0]) + 1;
    }
    msg.channel.bulkDelete(num);
    msg.channel.send(`bot deleted ${num - 1} messages for yo`);
  }
  if (command === "capslock") {
    const combinedArgs = args.join(" ");
    msg.channel.send(
      `${
        msg.author.username
      } is angry has something to say: \n ${combinedArgs.toUpperCase()}`
    );
  }

  if (command === "joke") {
    let getJoke = async () => {
      let joke = await (
        await fetch("https://official-joke-api.appspot.com/random_joke")
      ).json();
      return joke;
    };
    let jokeValue = await getJoke();
    console.log(jokeValue);
    msg.reply(`${jokeValue.setup}\n${jokeValue.punchline}`);
  }
  if (command === "fox") {
    let getFox = async () => {
      let fox = await (await fetch("https://randomfox.ca/floof/")).json();
      return fox;
    };
    let foxValue = await getFox();
    msg.reply(`${foxValue.image}`);
  }
  if (command === "panda") {
    let getPanda = async () => {
      let response = await (
        await fetch("https://some-random-api.ml/img/red_panda")
      ).json();
      return response;
    };
    let pandaValue = await getPanda();
    msg.reply(`${pandaValue.link}`);
  }
  if (command === "meme") {
    let getMeme = async () => {
      let meme = await (await fetch("https://some-random-api.ml/meme")).json();
      return meme;
    };
    let memeValue = await getMeme();

    msg.reply(`${memeValue.image}`);
  }
});

bot.login(config.discordApiToken);
