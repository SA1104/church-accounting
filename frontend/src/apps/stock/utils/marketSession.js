export function getKoreaMarketSession({ now = new Date(), isTradingDay = null } = {}) {
  // If isTradingDay is not explicitly true/false, we can't be sure it's a trading day
  if (isTradingDay === null) {
    return 'CALENDAR_UNKNOWN';
  }
  
  if (!isTradingDay) {
    return 'HOLIDAY';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
  
  const timeNum = hour * 100 + minute; // 08:30 -> 830, 15:30 -> 1530

  if (timeNum < 830) return 'PRE_MARKET_EXPECTED';
  if (timeNum < 900) return 'PRE_MARKET_OPEN';
  if (timeNum < 1520) return 'KRX_NXT_MAIN';
  if (timeNum < 1530) return 'KRX_CLOSING_AUCTION';
  if (timeNum < 1540) return 'NXT_AFTER_MARKET';
  if (timeNum < 1800) return 'KRX_AFTER_HOURS';
  
  return 'CLOSED';
}
