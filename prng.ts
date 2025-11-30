/**
 * Deterministic seedable PRNG using xoshiro128** algorithm.
 * Reproducible across runs given the same seed.
 */

export interface PRNG {
  /** Returns next float in [0, 1). */
  float(): number;

  /** Returns int in [min, max] (inclusive both ends). */
  int(min: number, max: number): number;

  /** Returns true with given probability in [0, 1]. */
  bool(p?: number): boolean;

  /** Picks one element from a non-empty array. */
  choice<T>(arr: readonly T[]): T;

  /**
   * Creates a deterministic sub-PRNG derived from this one,
   * using a label so the same label always yields the same stream
   * given the same parent seed.
   */
  fork(label: string): PRNG;
}

/** Factory: creates a PRNG from a string or number seed. */
export function createPRNG(seed: string | number): PRNG {
  const numericSeed = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  const state = initializeState(numericSeed);
  return new Xoshiro128StarStar(state);
}

/**
 * Hash a string to a 32-bit unsigned integer using a simple hash function.
 */
function hashString(str: string): number {
  let h = 2166136261 >>> 0; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/**
 * Use SplitMix32 to generate initial state from a numeric seed.
 * Returns 4 x 32-bit state values for xoshiro128**.
 */
function initializeState(seed: number): [number, number, number, number] {
  let state = seed >>> 0;

  const splitmix32 = (): number => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };

  return [splitmix32(), splitmix32(), splitmix32(), splitmix32()];
}

/**
 * xoshiro128** implementation.
 * A fast, high-quality PRNG with 128-bit state.
 */
class Xoshiro128StarStar implements PRNG {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(state: [number, number, number, number]) {
    this.s0 = state[0] >>> 0;
    this.s1 = state[1] >>> 0;
    this.s2 = state[2] >>> 0;
    this.s3 = state[3] >>> 0;

    // Ensure state is not all zeros
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) {
      this.s0 = 1;
    }
  }

  /**
   * Generate next 32-bit unsigned integer.
   */
  private next(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;

    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;

    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);

    this.s0 >>>= 0;
    this.s1 >>>= 0;
    this.s2 >>>= 0;
    this.s3 >>>= 0;

    return result;
  }

  float(): number {
    // Generate a float in [0, 1) with 53 bits of precision
    const a = this.next() >>> 5; // 27 bits
    const b = this.next() >>> 6; // 26 bits
    return (a * 67108864.0 + b) / 9007199254740992.0;
  }

  int(min: number, max: number): number {
    min = Math.floor(min);
    max = Math.floor(max);
    
    if (min > max) {
      [min, max] = [max, min];
    }
    
    const range = max - min + 1;
    if (range <= 0 || !Number.isFinite(range)) {
      return min;
    }

    // Use rejection sampling to avoid modulo bias
    const limit = Math.floor(0x100000000 / range) * range;
    let value: number;
    
    do {
      value = this.next();
    } while (value >= limit);

    return min + (value % range);
  }

  bool(p: number = 0.5): boolean {
    return this.float() < p;
  }

  choice<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return arr[this.int(0, arr.length - 1)];
  }

  fork(label: string): PRNG {
    // Create a deterministic fork by mixing current state with label hash
    const labelHash = hashString(label);
    
    // Generate 4 values from current state mixed with label
    const temp = new Xoshiro128StarStar([this.s0, this.s1, this.s2, this.s3]);
    
    // Mix label hash into the fork state
    const s0 = temp.next() ^ labelHash;
    const s1 = temp.next() ^ rotl(labelHash, 8);
    const s2 = temp.next() ^ rotl(labelHash, 16);
    const s3 = temp.next() ^ rotl(labelHash, 24);

    return new Xoshiro128StarStar([s0, s1, s2, s3]);
  }
}

/**
 * Rotate left (32-bit).
 */
function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

