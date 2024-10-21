import process from "node:node:process";
import "npm:dotenv@16.4.5/config"
import fs from "npm:fs@3.0.6"; // Add this line to import the 'fs' module
import OpenAI from "npm:openai@4.53.0";

const IA_ACTIVE = process.env?.IA_ACTIVE ?? 'false'
const isIAActive = IA_ACTIVE === 'true'

const openai = new OpenAI();

export async function speechToText(filePath) {
    if (!isIAActive) {
        return ""
    }
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
    });
    console.log("Transcription:");
    console.log(transcription.text);
    fs.unlinkSync(filePath);
    return `speechToText: \`${transcription.text}\``;
}