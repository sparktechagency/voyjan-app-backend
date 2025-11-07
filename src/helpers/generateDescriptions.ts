import { Category } from '../app/modules/category/category.model';
import { chatbot } from '../config/chatbot.config';

export const generateAiContnents = async (
  prompt: string,
  limit: number = 1000
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
