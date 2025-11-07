import { Category } from "../app/modules/category/category.model";
import { chatbot } from "../config/chatbot.config";

export const generateAiContnents = async (prompt: string,limit:number=1000) => {
    try {
        const response = await chatbot.generateContent(`generate a long and detailed description for ${prompt}. Make sure the response is plain and does not include markdown or icons. The response should be in max ${limit} characters.`);
        return response.response.text()?.replace(/(\r\n|\n|\r)/gm, " ");
    } catch (error) {
        return prompt
    }
};


export const getTheTypeUsingAI=async(prompt: string) =>{
    try {
        const categories = (await Category.find({})).map((c) => c.name);
        const prompData = `
        this are my categories ${categories.join(", ")} of places
        just read the text and give me the type of the place like museum,temple,church,market,etc only one and in string not markdown
        ${prompt}
        
        `
        const response = await chatbot.generateContent(prompData);
        return response.response.text()?.replace(/(\r\n|\n|\r)/gm, " ");
    } catch (error) {
      console.log(error);
        
    }
}