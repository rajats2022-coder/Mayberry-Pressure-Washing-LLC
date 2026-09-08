import { readFileSync } from 'node:fs';

// The website renders the latest complete, tenant-verified Google snapshot.
export const googleReviews = JSON.parse(readFileSync(new URL('../data/google-reviews.json', import.meta.url), 'utf8'));
if (googleReviews.placeId !== 'ChIJH1R4E00DQg4R_BKHMqJrDzc' || googleReviews.source !== 'google-business-profile' || googleReviews.reviews.length !== googleReviews.reviewCount) {
  throw new Error('Expected a complete Mayberry Google review snapshot');
}
export const publicGoogleRating = Number(googleReviews.rating).toFixed(1);
export const publicGoogleReviewCount = String(googleReviews.reviewCount);
export const reviewSnippets = googleReviews.reviews.filter(review => review.rating === 5 && review.text.trim()).slice(0, 3).map(review => [review.author, review.text]);
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function refreshReviewHtml(html, isReviewPage = false) {
  const count = publicGoogleReviewCount;
  const rating = publicGoogleRating;
  let result = html
    .replace(/"ratingValue":\s*"[\d.]+"/g, `"ratingValue": "${rating}"`)
    .replace(/"reviewCount":\s*"\d+"/g, `"reviewCount": "${count}"`)
    .replace(/\d+ 5-Star Google Reviews/g, `${count} Google Reviews`)
    .replace(/\d+ 5-star (Google reviews|reviews)/g, `${count} $1`)
    .replace(/\d+ Google [Rr]eviews/g, match => `${count} Google ${match.includes('Reviews') ? 'Reviews' : 'reviews'}`)
    .replace(/\d+(?:\.\d+)?(?= (?:on Google|Google rating|rating from|rating, customer))/g, rating)
    .replace(/(<strong>)\d+\.\d+(<\/strong>)/g, `$1${rating}$2`)
    .replace(/5-star rating on Mayberry/g, `${rating} rating on Mayberry`)
    .replace(/These 5-star reviews are from/g, 'These reviews are from');
  if (isReviewPage) {
    const cards = googleReviews.reviews.map(review => `<article class="review-card"><div><strong>${escapeHtml(review.author)}</strong></div><p class="stars" aria-label="${review.rating} out of 5 stars">${review.rating} stars</p>${review.text ? `<blockquote>${escapeHtml(review.text)}</blockquote>` : '<p>Rating only; no written comment.</p>'}</article>`).join('\n          ');
    result = result.replace(/(<div class="reviews-grid">)[\s\S]*?(\n        <\/div>\n      <\/div>\n    <\/section>)/, `$1\n          ${cards}$2`)
      .replace(/A snapshot of[^<]+/, `All ${count} Google reviews, refreshed ${googleReviews.lastFetchedAt.slice(0, 10)}. Visit Google for updates after this snapshot.`);
  }
  return result;
}
