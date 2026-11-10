export function isStripeCardReturnUrl(url: string) {
  return url.split(/[?#]/, 1)[0] === 'runout://safepay';
}
