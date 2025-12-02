import fetch from 'node-fetch';
import { translate } from 'google-translate-api-x';
import { language } from '../data/language';
import { translate as translateBing } from 'bing-translate-api';

async function translateWithLibre(
  text: string,
  targetLang: string
): Promise<string> {
 
  if (targetLang == 'ks') targetLang = 'ks-Arab';

  if(targetLang=='nb') targetLang = 'no';

  try {
    let translateText = (await translate(text, { to: targetLang })) as any;

    if (translateText) {
      return translateText.text;
    }
  } catch (error) {
    console.log(error);

  }

  try {
      const translateText = (await translateBing(text, 'en', targetLang)) as any;
    return translateText.translation;
  } catch (error) {
    console.log(error);
    
  }
   const response = await fetch('http://72.61.146.46:5003/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'en', // assuming your source text is always English
      target: targetLang,
    }),
  });

  const data: any = await response.json();

  let translatedText = data.translatedText;
  if (translatedText) {
    return translatedText;
  }


  return text;
}

async function textTranslationWithLibre(
  text: string,
  title: string,
  type: string,
  address: string,
  longText?: string,
  langName?: (typeof language)[0]['name']
) {
  const languageTranslate: Record<
    string,
    {
      translateText: string;
      title: string;
      type: string;
      address: string;
      translateLong?: string;
    }
  > = {};

  let tags = language;
  if (langName) {
    const langInfo = language.filter(l => l.name === langName);
    if (langInfo.length) tags = langInfo;
  }

  await Promise.all(
    tags.map(async lang => {
      try {
        const lg = lang.code;

        const [
          translateText,
          translateTitle,
          translateType,
          translateAddress,
          translateLong,
        ] = await Promise.all([
          translateWithLibre(text, lg),
          translateWithLibre(title, lg),
          translateWithLibre(type, lg),
          translateBing(address, 'en', lg),
          longText ? translateWithLibre(longText, lg) : Promise.resolve(''),
        ]);

        

        languageTranslate[lang.name] = {
          translateText,
          title: translateTitle,
          type: translateType,
          address: translateAddress?.translation!,
          translateLong: translateLong || '',
        };
      } catch (error) {
        console.error('LibreTranslate error for', lang.name, error);
      }
    })
  );

  return languageTranslate;
}

// Main function
export async function translateLanguages(
  text: string,
  title: string,
  type: string,
  address: string,
  longText?: string,
  lang?: (typeof language)[0]['name']
) {
  // Truncate text if too long
  if (text && text.length >= 1000) text = text.slice(0, 900);
  if (longText && longText.length >= 1000) longText = longText.slice(0, 900);

  const data = await textTranslationWithLibre(
    text,
    title,
    type,
    address,
    longText,
    lang
  );
  return data;
}

export const singleTextTranslationWithLibre = async (
  text: string,
  lang: string
) => {
  try {
    const allLang = language
    let diff_lang = {} as Record<string, string> 
    const data = await Promise.all(
      allLang.map(async lg => {
        try {
          const translateText = await translateWithLibre(text, lg.code);
          diff_lang[lg.name] = translateText
          return { [lg.name]: translateText };
        } catch (error) {
          diff_lang[lg.name] = text
          return { [lg.name]: text };
        }
      })
    );

    return diff_lang;
  } catch (error) {
    console.error('LibreTranslate error for', lang, error);
  }
};
