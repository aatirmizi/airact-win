/**
 * Utility for generating and validating 8-character PINs
 * Format: exactly 4 uppercase letters followed by 4 digits (e.g. ALEX4821)
 */

export function generate8CharPin(): string {
  // Avoid confusing characters: O, 0, 1, I
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let pin = '';
  for (let i = 0; i < 4; i++) {
    pin += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    pin += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return pin;
}

export function isValid8CharPin(pin: string): boolean {
  return /^[A-Z]{4}[0-9]{4}$/.test(pin.trim().toUpperCase());
}
