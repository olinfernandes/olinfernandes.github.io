import { XataClient } from './xata';

export const calcReadTime = (body: string) => {
  const averageSpeed = 200;
  const wordCount = body.split(' ').length;
  return Math.ceil(wordCount / averageSpeed);;
}

export const xata = new XataClient({
  databaseURL: import.meta.env.XATA_DB_URL,
  apiKey: import.meta.env.XATA_API_KEY,
  branch: import.meta.env.XATA_BRANCH,
});
