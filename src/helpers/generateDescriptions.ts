import { IAddress } from '../app/modules/address/address.interface';
import { Category } from '../app/modules/category/category.model';
import { chatbot } from '../config/chatbot.config';
import encode from '@toon-format/toon'
export const generateAiContnents = async (
  prompt: string,
  limit: number = 500
) => {
  try {
    const response = await chatbot.generateContent(
      `Generate a detailed, natural, and informative description for the following place:
${prompt}

Requirements:
- The tone should be clear, descriptive, and human-like.
- Do not include markdown, emojis, bullet points, or formatting symbols.
- The description must be no longer than ${limit} characters total.
- Do not mention these instructions in the output.

Return only the description.`
    );
    return response.response.text()?.replace(/(\r\n|\n|\r)/gm, ' ');
  } catch (error) {
    return prompt;
  }
};

export const getTheTypeUsingAI = async (prompt: string) => {
  try {
    const categories = (await Category.find({})).map(c => c.name);
    const prompData = `
       You are a place-type classifier. Below is a list of valid categories:
${categories.join(', ')}

Your task:
- Read the provided text.
- Identify which single category from the list best matches the place.
- Respond with ONLY the category name.
- Do NOT add explanations, extra words, punctuation, or formatting.

Text:
${prompt}
        `;
    const response = await chatbot.generateContent(prompData);
    return response.response.text()?.replace(/(\r\n|\n|\r)/gm, ' ');
  } catch (error) {
    console.log(error);
  }
};


export const fixTypeUsingAI = async (address:IAddress[]) => {
  try {
    const categories = (await Category.find({})).map(c => c.name);
    const prompData = `
    Here is my category list: ${categories.join(', ')}
Here is my address: ${JSON.stringify(address)}

Your task:
- Read the provided text.
- Identify which single category from the list best matches the place.
- Respond with ONLY the category name.
- Do NOT add explanations, extra words, punctuation, or formatting.

Return the result in this JSON format:
[
  {
    _id: "",
    type: ""
  }
] `
    const response = await chatbot.generateContent(prompData);
    const data = response.response.text()?.replace(/(\r\n|\n|\r)/gm, ' ')
    //remove ```json
    return JSON.parse(data.replace('```json','').replace('```','')) as {_id:string,type:string}[]

  } catch (error) {
    console.log(error);
    return []
  }
}


export const getLongDescriptionUsingAI = async (address: IAddress[]):Promise<{data:{short_descreption:string,long_descreption:string,type:string,_id:string}[],unpopular:string[]}> => {
  try {
      const categories = (await Category.find({})).map(c => c.name);
  const enCodedAddress = encode.encode(address?.map((a:any)=>({...a,_id:a._id.toString()})) as any);
  console.log(enCodedAddress);
  
const promptData = `
You are a place-type classifier.

Valid categories:
${categories.join(', ')}

Input addresses or place texts:
${enCodedAddress}

Your task:
1. Analyze each provided address or place text.
2. IGNORE places that are restaurants, hotels, stations, or schools.
3. For each remaining place, choose ONE best matching category from the valid categories list.
4. If a place does not clearly belong to any category or is not well-known, classify it as "unpopular".
5. For classified places, generate:
   - short_description (maximum 50 words)
   - long_description (detailed explanation)
6. Do NOT add explanations, comments, markdown, or extra text.

Return ONLY valid JSON in the following format:

{
  "data": [
    {
      "_id": "",
      "type": "",
      "short_description": "",
      "long_description": ""
    }
  ],
  "unpopular": []
}

Rules:
- "type" MUST be one of the valid categories.
- If a place is classified as "unpopular", DO NOT include it in "data"; add its "_id" to the "unpopular" array.
- Do not return null or undefined values.
- Do not return anything outside the JSON structure.
`;



  const response = await chatbot.generateContent(promptData);

  
  const data = response.response.text()?.replace(/(\r\n|\n|\r)/gm, ' ');
  
  //remove ```json
  return JSON.parse(data.replace('```json', '').replace('```', '')) 

  } catch (error) {
    console.log(error);
    
    return {} as any
  }
}
