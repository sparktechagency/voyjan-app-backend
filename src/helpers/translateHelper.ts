import { translate } from 'google-translate-api-x';
import { language } from '../data/language';
import { translate as translateBing } from 'bing-translate-api';

// Keep round-robin state globally
let providers: ('google' | 'bing')[] = ['google', 'bing'];
let providerIndex = 0;

// Get next provider in round-robin
function getNextProvider() {
  const provider = providers[providerIndex];
  providerIndex = (providerIndex + 1) % providers.length;
  return provider;
}

async function textTranslationWithBing(
  text: string,
  title: string,
  type: string,
  address: string,
  longText?: string,
  isError?: boolean
) {
  const languageTranslate: Record<
    string,
    { translateText: string; title: string; type: string; address: string, translateLong: string }
  > = {};

  await Promise.all(
    language.map(async lang => {
      try {
        let lg = lang.code;
        if (lang.code === 'zh-CN') lg = 'zh-Hans';

        if(lang.code === 'zh-TW') lg = 'zh-Hant';

        if(lang.code == "sr") lg = "sr-Cyrl";

        if (lang.code == 'no') lg = 'nb';

        const [translateText, translateTitle, translateType, translateAddress, translateLong] =
          await Promise.all([
            translateBing(text, 'en', lg),
            translateBing(title, 'en', lg),
            translateBing(type, 'en', lg),
            translateBing(address, 'en', lg),
            translateBing(longText!, 'en', lg),
          ]);


          
 
          

        languageTranslate[lang.name] = {
          translateText: translateText?.translation!,
          title: translateTitle?.translation!,
          type: translateType?.translation!,
          address: translateAddress?.translation!,
          translateLong: translateLong?.translation!,
        };
      } catch (error) {
        
        console.log(error);
        
        if (isError) {
          // console.log('Error in bing translation');
          return;
        }

        await textTranslationWithGoogle(text, title, type, address, true);
      }
    })
  );

  return languageTranslate;
}

async function textTranslationWithGoogle(
  text: string,
  title: string,
  type: string,
  address: string,
  isError?: boolean
) {
  console.log('translation started by Google');
  const languageTranslate: Record<
    string,
    { translateText: string; title: string; type: string; address: string }
  > = {};

  await Promise.all(
    language.map(async lang => {
      try {
        const [translateText, translateTitle, translateType, translateAddress] =
          await Promise.all([
            translate(text, { to: lang.code }),
            translate(title, { to: lang.code }),
            translate(type, { to: lang.code }),
            translate(address, { to: lang.code }),
          ]);

        languageTranslate[lang.name] = {
          translateText: translateText.text,
          title: translateTitle.text,
          type: translateType.text,
          address: translateAddress.text,
        };
      } catch (error) {
        if (isError) {
          console.log('Error in google translation');
          return;
        }

        await textTranslationWithBing(text, title, type, address, '', true);
      }
    })
  );

  return languageTranslate;
}

export async function translateLanguages(
  text: string,
  title: string,
  type: string,
  address: string,
  longText?: string
) {
  // Pick next provider in round-robin
  const provider = getNextProvider();

  const translator =
    provider === 'bing' ? textTranslationWithBing : textTranslationWithGoogle;
  const data = textTranslationWithBing(text, title, type, address, longText);

  return data;
}
