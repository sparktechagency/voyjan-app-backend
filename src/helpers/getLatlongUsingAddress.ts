import fetch from 'node-fetch';
import config from '../config';

export const getLatlongUsingAddress = async (address: string) => {
  const query = `
  SELECT ?place ?placeLabel ?coord WHERE {
    ?place wdt:P625 ?coord.
    ?place rdfs:label ?label.
    FILTER(LANG(?label) = "en").
    FILTER(CONTAINS(LCASE(?label), LCASE("${address}"))).
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }
  LIMIT 1
  `;

  const url = 'https://query.wikidata.org/sparql';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        Accept: 'application/sparql-results+json',
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(
        `Wikidata error: ${response.status} ${response.statusText}`
      );
    }

    const data: any = await response.json();
    

    if (!data.results.bindings.length) {
      return { error: 'No results found' };
    }

    const result = data.results.bindings[0];
    const [lat, lon] = result.coord.value
      .replace('Point(', '')
      .replace(')', '')
      .split(' ')
      .map(parseFloat);

    return {
      latitude: lat,
      longitude: lon,
      place: result.placeLabel.value,
    };
  } catch (err) {
    console.error('Error fetching coordinates:', err);
    return { error: 'Failed to fetch coordinates' };
  }
};

// export const getLatlongUsingAddress = async (address: string) => {
//   const query = `
//     SELECT ?place ?placeLabel ?coord ?lat ?lon WHERE {
//       ?place wdt:P625 ?coord.
//       ?place rdfs:label ?label.
//       FILTER(CONTAINS(LCASE(?label), LCASE("${address}"))).
//       BIND(geof:latitude(?coord) AS ?lat)
//       BIND(geof:longitude(?coord) AS ?lon)
//       SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
//     }
//     LIMIT 1
//   `;

//   const url = "https://query.wikidata.org/sparql";

//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//         "Accept": "application/sparql-results+json",
//         "User-Agent": "VoyazenApp/1.0 (sharif@gmail.com)", // 👈 important!
//       },
//       body: new URLSearchParams({ query }).toString(),
//     });

//     console.log(address, response.status);
//     console.log(await response.text());

//     const text = await response.text();
//     console.log(text);

//     if (!text) {
//       throw new Error("Empty response from Wikidata");
//     }

//     const data = JSON.parse(text);

//     if (!data.results || data.results.bindings.length === 0) {
//       console.warn("No results from Wikidata, fallback to OpenStreetMap...");
//       return await getFromOSM(address);
//     }

//     const result = data.results.bindings[0];
//     return {
//       latitude: parseFloat(result.lat.value),
//       longitude: parseFloat(result.lon.value),
//       place: result.placeLabel.value,
//     };
//   } catch (error) {
//     console.error("Error fetching coordinates:", error);
//     return await getFromOSM(address); // fallback
//   }
// };

// 🌍 Fallback: OpenStreetMap Nominatim
export const getFromOSM = async (address: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;

  try {
    const url = `https://us1.locationiq.com/v1/search.php?key=${config.locationQ.key}&q=${address}&format=json`;
    const res = await fetch(url);



    
    const data: any = await res.json();


    
    
    return {
      latitude: data[0]?.lat,
      longitude: data[0]?.lon,
      place: data[0]?.display_name,
    };
  } catch (err) {
    console.error('OSM fallback error:', err);
    console.error('OSM primary failed, falling back to LocationIQ...');
    // Example fallback provider
     const response = await fetch(url, {
      headers: {
        'User-Agent': 'VoyazenApp/1.0 (sharif@example.com)',
      },
    });



    const results: any = await response.json();
    
    if(results?.length < 1) throw new Error('No results from OSM');
    
    if (!results.length) return {};



    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      place: results[0].display_name,
    };
  }
};
