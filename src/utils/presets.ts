export interface SongPrompt {
  id: string;
  title: string;
  artist: string;
  category: 'Pop' | 'Disney' | 'Classics' | 'TV & Memes';
  phrase: string;
  tip: string;
}

export const SONG_PROMPTS: SongPrompt[] = [
  {
    id: '1',
    title: 'Let It Go',
    artist: 'Frozen',
    category: 'Disney',
    phrase: 'Let it go, let it go! Can’t hold it back anymore!',
    tip: 'Belt out high notes for funny backwards sounds!',
  },
  {
    id: '2',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    category: 'Classics',
    phrase: 'Mama, just killed a man, put a gun against his head...',
    tip: 'Operatic vibrato turns into alien speech backwards.',
  },
  {
    id: '3',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    category: 'Pop',
    phrase: 'I’m that bad type, make your mama sad type, duh!',
    tip: 'Whispery vowels sound hilarious when reversed.',
  },
  {
    id: '4',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    category: 'TV & Memes',
    phrase: 'Never gonna give you up, never gonna let you down!',
    tip: 'The ultimate reverse Rickroll challenge.',
  },
  {
    id: '5',
    title: 'Happy Birthday',
    artist: 'Traditional',
    category: 'Classics',
    phrase: 'Happy birthday to you, happy birthday to you!',
    tip: 'Short and sweet - perfect for quick rounds.',
  },
  {
    id: '6',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    category: 'Pop',
    phrase: 'I’m in love with the shape of you, we push and pull like a magnet do...',
    tip: 'Fast rhythmic syllables make tricky reverse puzzles.',
  },
  {
    id: '7',
    title: 'A Whole New World',
    artist: 'Aladdin',
    category: 'Disney',
    phrase: 'A whole new world, a dazzling place I never knew...',
    tip: 'Smooth legato notes sound surreal in reverse.',
  },
  {
    id: '8',
    title: 'Baby Shark',
    artist: 'Pinkfong',
    category: 'TV & Memes',
    phrase: 'Baby shark, doo-doo, doo-doo, doo-doo!',
    tip: 'Try getting the doo-doo syllables right backwards!',
  },
];

export const FUNNY_RATINGS = [
  { score: 1, title: 'Alien Radio', desc: 'Sounded like galactic static, but we loved the confidence!' },
  { score: 2, title: 'Summoned a Demon', desc: 'Ancient incantation vibes. Half a word was recognizable!' },
  { score: 3, title: 'Close Cousin', desc: 'We could hear the tune! Just need a little phonetic polish.' },
  { score: 4, title: 'Vocal Wizard', desc: 'Insanely close! The melody came right back to life!' },
  { score: 5, title: 'Godlike Sorcery', desc: 'HOW DID YOU DO THAT?! Spot-on reverse mimicry!' },
];

export const PARTY_REACTIONS = [
  { emoji: '🤯', label: 'Mind Blown' },
  { emoji: '🤣', label: 'Crying Laughing' },
  { emoji: '💀', label: 'Dead' },
  { emoji: '🔥', label: 'Straight Fire' },
  { emoji: '🏆', label: 'Grammy Winner' },
];
