// First test with OpenAi integration for JavaScript

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: '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'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "How long should it take to read the first chapter of the Hobbit? Please give me the answer in the format XX:XX [hours:minutes] with no extra information." }],
    messages: [{ role: "user", content: "Divide the first chapter of the Hobbit into tones and list them in order. Please give me a list of one word answers. One answer for each tone." }],
    messages: [{ role: "user", content: "Give me another list of 1 word each of a genre of music that would match each tone of the Hobbit." }],
    messages: [{ role: "user", content: "Lastly give me a random song from each genre in the list and add it to the same list you've already provided. Make sure the songs match the tone and genres you've already provided for the Hobbit." }],
    model: "gpt-4",
  });

  console.log(completion.choices[0]);
}

main();