// full: parse with time if set to true. Default: true
export const parseTime = (time: string, full: boolean = true): string => {
  let d = new Date(time);
  if (full) { return d.toLocaleString(); } else { return d.toLocaleDateString(); }
}