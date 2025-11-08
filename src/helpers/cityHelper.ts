export interface WikipediaSummary {
  type: string;
  title: string;
  displaytitle: string;
  namespace: {
    id: number;
    text: string;
  };
  wikibase_item: string;
  titles: {
    canonical: string;
    normalized: string;
    display: string;
  };
  pageid: number;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  lang: string;
  dir: string;
  revision: string;
  tid: string;
  timestamp: string;
  description?: string;
  description_source?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  content_urls: {
    desktop: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
    mobile: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
  };
  extract?: string;
  extract_html?: string;
}

export interface WikiPage {
  pageid: number;
  title: string;
  extract: string;
  description?: string;
  image?: {
    source: string;
    width: number;
    height: number;
  } | null;
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
  categories?: {
    pageid: number;
    ns: number;
    title: string;
  }[];
  original?: {
    source: string;
    width: number;
    height: number;
  }
}

import axios from "axios";

export async function getCitySummary(city: string): Promise<WikipediaSummary> {
  const res = await axios.get<WikipediaSummary>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
  );
  return res.data;
}

export async function getCityByPageId(pageid: number): Promise<WikiPage> {
try {
      const res:any = await axios.get<WikiPage>(
    `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageid}&prop=extracts|images|pageimages|coordinates|description|categories&format=json&explaintext=1&piprop=original`,
    {
      headers: {
        'User-Agent': 'VoyazenApp/1.0 (sharif@example.com)',
      },
    }
  );
  
  return res.data?.query?.pages?.[pageid];
} catch (error:any) {
    console.log(error?.response?.data);

    return {
        pageid,
        title: error?.response?.data?.error?.info,
        extract: error?.response?.data?.error?.info
    }
    
}
}