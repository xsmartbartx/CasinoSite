/**
 * Formats a number as a currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a timestamp in a relative time format (e.g., "Just now", "5 mins ago")
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  // Fall back to a simple date format
  return date.toLocaleDateString();
}

/**
 * Calculates the probability of a given event
 */
export function calculateProbability(favorableOutcomes: number, totalOutcomes: number): number {
  return (favorableOutcomes / totalOutcomes) * 100;
}

/**
 * Calculates the expected value of a bet
 */
export function calculateExpectedValue(probability: number, winAmount: number, betAmount: number): number {
  const probDecimal = probability / 100;
  return (probDecimal * winAmount) - ((1 - probDecimal) * betAmount);
}

/**
 * Generates a random number between min and max (inclusive)
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulates a fair dice roll
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Simulates a roulette wheel spin (European roulette: 0-36)
 */
export function spinRouletteWheel(): number {
  return Math.floor(Math.random() * 37);
}

/**
 * Gets the color of a roulette number
 */
export function getRouletteColor(number: number): string {
  if (number === 0) return 'green';
  return number % 2 === 0 ? 'black' : 'red';
}