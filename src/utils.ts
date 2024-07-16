export const calcReadTime = (body: string) => {
  const averageSpeed = 200;
  const wordCount = body.split(' ').length;
  return Math.ceil(wordCount / averageSpeed);;
}
