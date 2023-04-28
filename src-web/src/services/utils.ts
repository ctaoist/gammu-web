export const parseTime = (time: string): string => {
  let d = new Date(time);
  return d.toLocaleString();
}