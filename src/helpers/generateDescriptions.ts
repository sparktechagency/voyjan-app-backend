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
  }
}


export const getLongDescriptionUsingAI = async (address: IAddress[]) => {
  const categories = (await Category.find({})).map(c => c.name);
  const enCodedAddress = encode.encode(address?.map((a:any)=>({...a,_id:a._id.toString()})) as any);
  console.log(enCodedAddress);
  
  const prompData = `
       You are a place-type classifier. Below is a list of valid categories:
${categories.join(', ')}
my address: ${enCodedAddress}

Your task:
- Read the provided text.
- Identify which single category from the list best matches the place.
- Respond with ONLY the category name.
- Generate a short summary of the place called short_descreption in 50 words.
- Generate a long summary of the place called long_descreption.
- Do NOT add explanations, extra words, punctuation, or formatting.

Return the result in this JSON format:
[
  {
    short_descreption: "",
    long_descreption: "",
    type: "",
    _id: ""
  }
]

        `;
  const response = await chatbot.generateContent(prompData);

  const data = response.response.text()?.replace(/(\r\n|\n|\r)/gm, ' ');
  
  //remove ```json
  return JSON.parse(data.replace('```json', '').replace('```', '')) as {
    short_descreption: string;
    long_descreption: string;
    type: string;
    _id: string;
  }[]

}
