import { translate } from 'google-translate-api-x';
import { language } from '../data/language';

export async function translateLanguages(text: string, title: string) {
  const languageTranslate: Record<
    string,
    { translateText: string }
  > = {};

  for (const lang of language) {
    try {
      const translateText = await translate(text, { to: lang.code });
      languageTranslate[lang.name] = {
        translateText: translateText.text,
      };
    } catch (error) {
        console.log(error);
        
    }
  }
  return languageTranslate;
}
