import OpenAI from "openai";

import fs from 'fs'
import path from "path";
import { fileURLToPath } from "url";


const audioTOText = async (data: ArrayBuffer) => {

    const buffer = Buffer.from(data)

    const __filename = fileURLToPath(import.meta.url)
    // console.log("filename 14",__filename)
    const __dirname = path.dirname(__filename)
    // console.log("dirname 16",__dirname)


    const tempPath = path.join(__dirname, "temp_audio.mp3");
    fs.writeFileSync(tempPath, buffer);


    const openai = new OpenAI({ apiKey: process.env.API_KEY })

    const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: "whisper-1",
        language:"en"
    });
    return response.text

}
export default audioTOText