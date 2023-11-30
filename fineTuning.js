import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
    apiKey: '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'
});

async function main() {
    let file = await openai.files.create({
        file: fs.createReadStream("tuning/fineTuningNew.jsonl"),
        purpose: 'fine-tune'
    });

    let fineTune = await openai.fineTuning.jobs.create({
        model: 'gpt-3.5-turbo',
        training_file: file.id
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
