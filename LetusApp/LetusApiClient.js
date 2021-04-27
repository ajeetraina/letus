import { LETUS_API_URL } from '@env';

function postData(url, data) {
  return fetch(LETUS_API_URL + url, {
    method: 'POST',
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
    },
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  });
}

export function mapRecords(jsonData) {
  const records = jsonData.records
    ? jsonData.records.map((record) => {
        const { _header, _values } = record;
        const mapped = _header.map((header, index) => [header, _values[index]]);
        return mapped.reduce((mapped, header) => {
          mapped[header[0]] = header[1];
          return mapped;
        }, {});
      })
    : [];
  return records;
}

export const LetusApiClient = {
  getPosts: async (asUser) => {
    console.log('get posts');
    const res = await fetch(LETUS_API_URL + '/GetPosts?as=' + asUser);
    const json = await res.json();
    return mapRecords(json);
  },
  createPost: async (text, asUser) => {
    let results = [];
    try {
      const jsonData = { text };
      const [classificationResponse, analyzeResponse] = await Promise.all([
        postData('/ClassifyText', jsonData),
        postData('/AnalyzeSentiment', jsonData),
      ]);
      const { categories } = await classificationResponse.json();
      const { sentiment } = await analyzeResponse.json();
      console.log({
        text,
        name: asUser,
        categories,
        sentiment,
      });
      const res = await postData('/CreatePost', {
        text,
        name: asUser,
        categories,
        sentiment,
      });
      results = await res.json();
      console.log('createPost', results);
    } catch (ex) {
      console.log('error', ex);
    }
    return results;
  },
};