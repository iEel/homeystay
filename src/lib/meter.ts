/**
 * Meter utility — handle 4-digit meter rollover (0000–9999)
 * 
 * When a meter rolls over from 9999 → 0001, naive subtraction gives a negative value.
 * This function detects that scenario and calculates the correct units.
 * 
 * Example: prev=9950, curr=0030 → (10000 - 9950) + 30 = 80 units
 */

const METER_MAX = 10000; // 4-digit meter: 0000–9999

/**
 * Calculate meter units with rollover support.
 * Returns 0 if both values are 0 or curr is 0 (no reading yet).
 */
export function calcMeterUnits(prev: number, curr: number): number {
    if (curr <= 0) return 0;
    if (curr >= prev) {
        return curr - prev;
    }
    // Rollover detected: meter went past 9999 back to 0
    return (METER_MAX - prev) + curr;
}

/**
 * Check if a meter reading appears to be a rollover situation
 */
export function isRollover(prev: number, curr: number): boolean {
    return curr > 0 && curr < prev;
}
