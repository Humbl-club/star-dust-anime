// Mock data for demonstration purposes
// In production, this would be replaced with API calls

export interface AnimeData {
  id: number;
  title: string;
  image: string;
  rating: number;
  year: number;
  episode_count?: number;
  chapter_count?: number;
  status: string;
  genres: string[];
  type: "anime" | "manga";
  synopsis?: string;
  trailer_url?: string;
  studio?: string;
  author?: string;
}

export const mockAnimeData: AnimeData[] = [
  {
    id: 1,
    title: "Attack on Titan",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    rating: 9.2,
    year: 2013,
    episode_count: 87,
    status: "Completed",
    genres: ["Action", "Drama", "Fantasy"],
    type: "anime",
    synopsis: "In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid beings who devour humans seemingly without reason.",
    studio: "Mappa"
  },
  {
    id: 2,
    title: "Death Note",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    rating: 9.0,
    year: 2006,
    episode_count: 37,
    status: "Completed",
    genres: ["Psychological", "Supernatural", "Thriller"],
    type: "anime",
    synopsis: "A high school student discovers a supernatural notebook that allows him to kill anyone whose name he writes in it.",
    studio: "Madhouse"
  },
  {
    id: 3,
    title: "One Piece",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop",
    rating: 9.5,
    year: 1999,
    episode_count: 1000,
    status: "Ongoing",
    genres: ["Adventure", "Comedy", "Shounen"],
    type: "anime",
    synopsis: "Follow Monkey D. Luffy, a young pirate with rubber powers, as he explores the Grand Line with his diverse crew of pirates.",
    studio: "Toei Animation"
  },
  {
    id: 4,
    title: "Demon Slayer",
    image: "https://images.unsplash.com/photo-1578662015463-3d2b3cd3a833?w=400&h=600&fit=crop",
    rating: 8.7,
    year: 2019,
    episode_count: 32,
    status: "Ongoing",
    genres: ["Action", "Historical", "Supernatural"],
    type: "anime",
    synopsis: "A young boy becomes a demon slayer to avenge his family and cure his sister who has been turned into a demon.",
    studio: "Ufotable"
  },
  {
    id: 5,
    title: "Jujutsu Kaisen",
    image: "https://images.unsplash.com/photo-1606891822406-221b0cd2e5ca?w=400&h=600&fit=crop",
    rating: 8.8,
    year: 2020,
    episode_count: 24,
    status: "Ongoing",
    genres: ["Action", "School", "Supernatural"],
    type: "anime",
    synopsis: "A high school student joins a secret organization of sorcerers to eliminate a powerful curse and save his classmates.",
    studio: "Mappa"
  },
  {
    id: 6,
    title: "Naruto",
    image: "https://images.unsplash.com/photo-1592503254549-d83d24a4dfab?w=400&h=600&fit=crop",
    rating: 8.4,
    year: 2002,
    episode_count: 720,
    status: "Completed",
    genres: ["Action", "Martial Arts", "Shounen"],
    type: "anime",
    synopsis: "A young ninja seeks recognition from his peers and dreams of becoming the Hokage, the leader of his village.",
    studio: "Pierrot"
  },
  {
    id: 7,
    title: "Berserk",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    rating: 9.1,
    year: 1989,
    chapter_count: 374,
    status: "Ongoing",
    genres: ["Action", "Adventure", "Drama", "Fantasy", "Horror"],
    type: "manga",
    synopsis: "A dark medieval fantasy following the journey of Guts, a lone mercenary warrior, and his struggle against demonic forces.",
    author: "Kentaro Miura"
  },
  {
    id: 8,
    title: "One Punch Man",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    rating: 8.9,
    year: 2015,
    episode_count: 24,
    status: "Ongoing",
    genres: ["Action", "Comedy", "Superhero"],
    type: "anime",
    synopsis: "A superhero who can defeat any enemy with a single punch struggles with the mundane problems that come with his overwhelming power.",
    studio: "Madhouse"
  },
  {
    id: 9,
    title: "My Hero Academia",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop",
    rating: 8.6,
    year: 2016,
    episode_count: 138,
    status: "Ongoing",
    genres: ["Action", "School", "Superhero"],
    type: "anime",
    synopsis: "In a world where most people have superpowers, a powerless boy enrolls in a prestigious hero academy.",
    studio: "Bones"
  },
  {
    id: 10,
    title: "Chainsaw Man",
    image: "https://images.unsplash.com/photo-1606891822406-221b0cd2e5ca?w=400&h=600&fit=crop",
    rating: 8.8,
    year: 2022,
    episode_count: 12,
    status: "Ongoing",
    genres: ["Action", "Supernatural", "Gore"],
    type: "anime",
    synopsis: "A young man makes a contract with a chainsaw devil to become a devil hunter and pay off his debts.",
    studio: "Mappa"
  },
  {
    id: 11,
    title: "Tokyo Ghoul",
    image: "https://images.unsplash.com/photo-1578662015463-3d2b3cd3a833?w=400&h=600&fit=crop",
    rating: 8.2,
    year: 2014,
    episode_count: 48,
    status: "Completed",
    genres: ["Action", "Horror", "Urban Fantasy"],
    type: "anime",
    synopsis: "A college student is turned into a half-ghoul and must learn to survive in a world where ghouls hunt humans.",
    studio: "Pierrot"
  },
  {
    id: 12,
    title: "Fullmetal Alchemist: Brotherhood",
    image: "https://images.unsplash.com/photo-1592503254549-d83d24a4dfab?w=400&h=600&fit=crop",
    rating: 9.7,
    year: 2009,
    episode_count: 64,
    status: "Completed",
    genres: ["Adventure", "Drama", "Fantasy"],
    type: "anime",
    synopsis: "Two brothers search for the Philosopher's Stone to restore their bodies after a failed alchemical experiment.",
    studio: "Bones"
  }
];

export const getTrendingAnime = () => mockAnimeData.slice(0, 6);
export const getRecentlyAdded = () => mockAnimeData.slice(6, 12);
export const getTopRated = () => [...mockAnimeData].sort((a, b) => b.rating - a.rating).slice(0, 6);