export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: 'stamp-blue' | 'mint' | 'saffron' | 'blush' | 'kraft' | 'paper-2';
  bgHex: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'tech',
    name: 'Tech',
    emoji: '🎧',
    color: 'stamp-blue',
    bgHex: '#A9CBE0',
    description: 'Analog-feel audio gear, mechanical dials, and desktop instruments.',
  },
  {
    id: 'home',
    name: 'Home',
    emoji: '🪴',
    color: 'mint',
    bgHex: '#BCD9C4',
    description: 'Turned wood vessels, raw terracotta pots, and tactile tableware.',
  },
  {
    id: 'style',
    name: 'Style',
    emoji: '👟',
    color: 'saffron',
    bgHex: '#F4B63F',
    description: 'Heavyweight loopback cotton, vulcanized canvas, and brass accents.',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    emoji: '🧴',
    color: 'blush',
    bgHex: '#F2C4B8',
    description: 'Cold-pressed botanical oils, beeswax salves, and amber dropper jars.',
  },
  {
    id: 'books',
    name: 'Books',
    emoji: '📚',
    color: 'kraft',
    bgHex: '#C99A67',
    description: 'Smyth-sewn folios, letterpress editions, and acid-free stationery.',
  },
  {
    id: 'play',
    name: 'Play',
    emoji: '🎮',
    color: 'paper-2',
    bgHex: '#EADFCB',
    description: 'Wooden game tiles, mechanical puzzles, and hand-printed playing cards.',
  },
];
