export const isFirefox = (): boolean => /firefox/i.test(navigator.userAgent);

export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
