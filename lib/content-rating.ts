import type { Media } from './recommendations';
export function isAdult(item: Media): boolean {
  return ['Book', 'Movie', 'TV'].includes(item.type) && (item.adult === true || item.adultMarked === true);
}
export function inContentSection(item: Media, adult: boolean): boolean {
  return isAdult(item) === adult;
}
export function contentLabel(item: Media): string {
  if (!['Book', 'Movie', 'TV'].includes(item.type)) return '';
  if (item.adultMarked) return '18+ · marked by you';
  if (item.adult) return '18+ · ' + (item.contentRating || 'provider flagged');
  return item.contentRating ? 'Rating: ' + item.contentRating : 'Content rating unknown';
}
// Mosaic groups mature ratings here; this is not a legal age classification.
export function matureRating(rating: unknown): boolean {
  return typeof rating === 'string' && ['R', 'NC-17', 'TV-MA', '18', 'R18', '18+'].includes(rating.toUpperCase().trim());
}
