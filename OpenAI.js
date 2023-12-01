// First test with OpenAi integration for JavaScript. This file serves no functionality, it was purely my testing ground for openai functions.

import OpenAI from "openai";

var userBook = "The Hobbit";

var genres = "acoustic, afrobeat, alt-rock, alternative, ambient, anime, black-metal, bluegrass, blues, bossanova, brazil, breakbeat, british, cantopop, chicago-house, children, chill, classical, club, comedy, country, dance, dancehall, death-metal, deep-house, detroit-techno, disco, disney, drum-and-bass, dub, dubstep, edm, electro, electronic, emo, folk, forro, french, funk, garage, german, gospel, goth, grindcore, groove, grunge, guitar, happy, hard-rock, hardcore, hardstyle, heavy-metal, hip-hop, holidays, honky-tonk, house, idm, indian, indie, indie-pop, industrial, iranian, j-dance, j-idol, j-pop, j-rock, jazz, k-pop, kids, latin, latino, malay, mandopop, metal, metal-misc, metalcore, minimal-techno, movies, mpb, new-age, new-release, opera, pagode, party, philippines-opm, piano, pop, pop-film, post-dubstep, power-pop, progressive-house, psych-rock, punk, punk-rock, r-n-b, rainy-day, reggae, reggaeton, road-trip, rock, rock-n-roll, rockabilly, romance, sad, salsa, samba, sertanejo, show-tunes, singer-songwriter, ska, sleep, songwriter, soul, soundtracks, spanish, study, summer, swedish, synth-pop, tango, techno, trance, trip-hop, turkish, work-out, world-music";

const openai = new OpenAI({
    apiKey: 'yourOpenAIApiKeyString'
});

async function isBook(book) {
  const completion = await openai.chat.completions.create({
    messages: [{role: "user", content: "Is " + book + " a known written book? Please only answer yes or no lowercase."}],
    model: "gpt-4"
  })

  const messageContent = completion.choices[0].message.content;

  if(messageContent === 'yes')
  {
    return true;
  }
  else{
    return false;
  }

}

async function time(book) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "How long should it take to read " + book + "? Please give me the answer in the format XX:XX [hours:minutes] with no extra information." }],
    model: "gpt-4"
  });

  const messageContent = completion.choices[0].message.content;
  return messageContent;
}

async function themesByChapter(book, chapterNum, gen) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Can you provide a list of themes in chapter " + chapterNum + " of " + book + " as you would naturally come across them while reading? Please provide each theme in the list with as short a descriptor as possible."}],
    model: "gpt-4"
  })

  const messageContent = completion.choices[0].message.content;
  return messageContent;
}

async function genrePerTheme(themes, gen){
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Given the following list of themes, can you replace each item on that list with either a genre or list of genres (chosen from the following given list of genres) that would best represent the theme? " + gen + " " + themes + " Please do not number the list, instead put a new line. Only answer each line in form of the genre names separated by commas and spaces. Do not specify which theme the genres belong to."}],
    model: "gpt-4"
  })

  const messageContent = completion.choices[0].message.content;
  return messageContent;
}

async function howManyChapters(book) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "How many chapters are in " + book + "? Please give the answer only as a number."}],
    model: "gpt-4"
  })

  const messageContent = completion.choices[0].message.content;
  return messageContent;
}

async function fullAnalysis(book, gen, chapterNum){
  const completion = await openai.chat.completions.create({
    messages: [
      {"role": "system", "content": "Given a chapter in a given book, analyze the chapter in that book and list themes as they appear in each chapter. After the list of themes is compiled, assign each theme a short list of given genres. Output only up to five genres that exist in the given list. Output each list on a new line."},
      { "role": "user", "content": "Please analyze chapter " + chapterNum + "from " + book + " and assign it a list of genres that exist within the following list: " + gen}
    ],
    model: "ft:gpt-3.5-turbo-0613:personal::8LzI0kOy"
  })

  const messageContent = completion.choices[0].message.content;
  return messageContent;
}

/* async function main() {
  var bookTruth = await isBook(userBook);

  if (!bookTruth) {
    console.log("Please enter a valid book.");
    return;
  }

  /* var bookTime = await time(userBook);
  console.log(bookTime);

  var numOfChapters = await howManyChapters(userBook);
  console.log(numOfChapters); */

  //var themes = await themesByChapter(userBook, 2);
  //console.log(themes); */
async function main() {
  var genreList = await fullAnalysis(userBook, genres, 2);
  console.log(genreList);

  var newArray = genreList.split("\n");

  console.log("From array: " + newArray[2]);
}

main();

