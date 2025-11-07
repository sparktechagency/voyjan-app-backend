import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function compressImageFromUrl(imageUrl: string) {
  try {

    // Ensure folder exists
    const folderPath = path.join(process.cwd(), "uploads", "image");
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    // Download remote image
    const { data } = await axios.get(imageUrl, { responseType: "arraybuffer",  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
  } });
    const imageBuffer = Buffer.from(data);

    // Generate safe file name
    const fileName = `${randomUUID()}.jpg`;
    const outputPath = path.join(folderPath, fileName);

    // Compress
    await sharp(imageBuffer)
      .jpeg({ quality: 10 }) // range: 0 - 100
      .toFile(outputPath);



    // Your CDN or static URL path
    return `https://api.voyagen.co.uk/image/${fileName}`;
  } catch (error: any) {
    console.log("Compression Error:", error?.response?.data || error.message);
    // Fallback to original image
    return imageUrl;
  }
}
