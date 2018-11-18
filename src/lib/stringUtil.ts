export function capitalizeFirstLetter(s: string) {
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.substr(1);
}
