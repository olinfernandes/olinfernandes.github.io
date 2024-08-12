export const calcReadTime = (body: string) => {
  const averageWpm = 200;
  const wordCount = body.split(" ").length;
  return Math.ceil(wordCount / averageWpm);
};

export const shuffleArray = (arr: any[]) => arr.sort(() => 0.5 - Math.random());
