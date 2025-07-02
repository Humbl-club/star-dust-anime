// Mock anime data for development
export interface Anime {
  id: string;
  mal_id?: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string;
  type: string;
  episodes?: number;
  status: string;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  year?: number;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  image_url: string;
  trailer_url?: string;
  genres: string[];
  studios?: string[];
  themes?: string[];
  demographics?: string[];
}

export interface Manga {
  id: string;
  mal_id?: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string;
  type: string;
  chapters?: number;
  volumes?: number;
  status: string;
  published_from?: string;
  published_to?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  image_url: string;
  genres: string[];
  authors?: string[];
  serializations?: string[];
  themes?: string[];
  demographics?: string[];
}

export const mockAnime: Anime[] = [
  {
    id: "1",
    mal_id: 16498,
    title: "Attack on Titan",
    title_english: "Attack on Titan",
    title_japanese: "進撃の巨人",
    synopsis: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not born out of hunger but what appears to be out of pleasure.",
    type: "TV",
    episodes: 25,
    status: "Finished Airing",
    aired_from: "2013-04-07",
    aired_to: "2013-09-29",
    season: "Spring",
    year: 2013,
    score: 9.0,
    scored_by: 1200000,
    rank: 1,
    popularity: 1,
    members: 2500000,
    favorites: 180000,
    image_url: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    genres: ["Action", "Drama", "Fantasy", "Shounen"],
    studios: ["Pierrot", "WIT Studio"],
    themes: ["Military", "Survival"],
    demographics: ["Shounen"]
  },
  {
    id: "2",
    mal_id: 11061,
    title: "Hunter x Hunter (2011)",
    title_english: "Hunter x Hunter",
    title_japanese: "ハンター×ハンター",
    synopsis: "Hunter x Hunter is set in a world where Hunters exist to perform all manner of dangerous tasks like capturing criminals and bravely searching for lost treasures in uncharted territories. Twelve-year-old Gon Freecss is determined to become the best Hunter possible in hopes of finding his father, who was a Hunter himself and had long ago abandoned his young son.",
    type: "TV",
    episodes: 148,
    status: "Finished Airing",
    aired_from: "2011-10-02",
    aired_to: "2014-09-24",
    season: "Fall",
    year: 2011,
    score: 9.1,
    scored_by: 800000,
    rank: 2,
    popularity: 2,
    members: 1800000,
    favorites: 120000,
    image_url: "https://cdn.myanimelist.net/images/anime/11/33657.jpg",
    genres: ["Action", "Adventure", "Fantasy", "Shounen"],
    studios: ["Madhouse"],
    themes: ["Super Power"],
    demographics: ["Shounen"]
  },
  {
    id: "3",
    mal_id: 38000,
    title: "Demon Slayer",
    title_english: "Demon Slayer: Kimetsu no Yaiba",
    title_japanese: "鬼滅の刃",
    synopsis: "Ever since the death of his father, the burden of supporting the family has fallen upon Tanjirou Kamado's shoulders. Though living impoverished on a remote mountain, the Kamado family are able to enjoy a relatively peaceful and happy life. One day, Tanjirou decides to go down to the local village to make a little money selling charcoal.",
    type: "TV",
    episodes: 26,
    status: "Finished Airing",
    aired_from: "2019-04-06",
    aired_to: "2019-09-28",
    season: "Spring",
    year: 2019,
    score: 8.7,
    scored_by: 1500000,
    rank: 3,
    popularity: 3,
    members: 2200000,
    favorites: 95000,
    image_url: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    genres: ["Action", "Historical", "Shounen", "Supernatural"],
    studios: ["Ufotable"],
    themes: ["Mythology"],
    demographics: ["Shounen"]
  },
  {
    id: "4",
    mal_id: 1535,
    title: "Death Note",
    title_english: "Death Note",
    title_japanese: "デスノート",
    synopsis: "A shinigami, as a god of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note. One day, Ryuk, bored by the shinigami lifestyle and interested in seeing how a human would use a Death Note, drops one into the human realm.",
    type: "TV",
    episodes: 37,
    status: "Finished Airing",
    aired_from: "2006-10-04",
    aired_to: "2007-06-27",
    season: "Fall",
    year: 2006,
    score: 9.0,
    scored_by: 1100000,
    rank: 4,
    popularity: 4,
    members: 2000000,
    favorites: 140000,
    image_url: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    genres: ["Drama", "Psychological", "Shounen", "Supernatural", "Thriller"],
    studios: ["Madhouse"],
    themes: ["Detective"],
    demographics: ["Shounen"]
  },
  {
    id: "5",
    mal_id: 20583,
    title: "Haikyu!!",
    title_english: "Haikyu!!",
    title_japanese: "ハイキュー!!",
    synopsis: "Inspired after watching a volleyball ace nicknamed 'Little Giant' in action, small-statured Shouyou Hinata revives the volleyball club at his middle school. The newly-formed team even makes it to a tournament; however, their first match turns out to be their last when they are brutally squashed by the 'King of the Court,' Tobio Kageyama.",
    type: "TV",
    episodes: 25,
    status: "Finished Airing",
    aired_from: "2014-04-06",
    aired_to: "2014-09-21",
    season: "Spring",
    year: 2014,
    score: 8.7,
    scored_by: 600000,
    rank: 5,
    popularity: 5,
    members: 1200000,
    favorites: 75000,
    image_url: "https://cdn.myanimelist.net/images/anime/7/76014.jpg",
    genres: ["Drama", "School", "Shounen", "Sports"],
    studios: ["Production I.G"],
    themes: ["Team Sports"],
    demographics: ["Shounen"]
  },
  {
    id: "6",
    mal_id: 9253,
    title: "Steins;Gate",
    title_english: "Steins;Gate",
    title_japanese: "シュタインズ・ゲート",
    synopsis: "The self-proclaimed mad scientist Rintarou Okabe rents out a room in a rickety old building in Akihabara, where he indulges himself in his hobby of inventing prospective 'future gadgets' with fellow lab members: Mayuri Shiina, his air-headed childhood friend, and Hashida Itaru, a perverted hacker nicknamed 'Daru.'",
    type: "TV",
    episodes: 24,
    status: "Finished Airing",
    aired_from: "2011-04-06",
    aired_to: "2011-09-14",
    season: "Spring",
    year: 2011,
    score: 9.1,
    scored_by: 700000,
    rank: 6,
    popularity: 6,
    members: 1400000,
    favorites: 110000,
    image_url: "https://cdn.myanimelist.net/images/anime/5/73199.jpg",
    genres: ["Drama", "Sci-Fi", "Thriller"],
    studios: ["White Fox"],
    themes: ["Psychological", "Time Travel"],
    demographics: []
  }
];

export const mockManga: Manga[] = [
  {
    id: "1",
    mal_id: 2,
    title: "Berserk",
    title_english: "Berserk",
    title_japanese: "ベルセルク",
    synopsis: "Guts, a former mercenary now known as the 'Black Swordsman,' is out for revenge. After a tumultuous childhood, he finally finds someone he respects and believes he can trust, only to have everything fall apart when this person takes away everything important to Guts for the purpose of fulfilling his own desires.",
    type: "Manga",
    chapters: 374,
    volumes: 41,
    status: "Publishing",
    published_from: "1989-08-25",
    score: 9.4,
    scored_by: 200000,
    rank: 1,
    popularity: 1,
    members: 400000,
    favorites: 45000,
    image_url: "https://cdn.myanimelist.net/images/manga/1/157897.jpg",
    genres: ["Action", "Adventure", "Drama", "Fantasy", "Horror", "Seinen"],
    authors: ["Miura, Kentaro"],
    serializations: ["Young Animal"],
    themes: ["Military", "Mythology"],
    demographics: ["Seinen"]
  },
  {
    id: "2",
    mal_id: 13,
    title: "One Piece",
    title_english: "One Piece",
    title_japanese: "ワンピース",
    synopsis: "Gol D. Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line. The capture and death of Roger by the World Government brought a change throughout the world. His last words before his death revealed the location of the greatest treasure in the world, One Piece.",
    type: "Manga",
    chapters: 1100,
    volumes: 105,
    status: "Publishing",
    published_from: "1997-07-22",
    score: 9.2,
    scored_by: 180000,
    rank: 2,
    popularity: 2,
    members: 350000,
    favorites: 38000,
    image_url: "https://cdn.myanimelist.net/images/manga/2/253146.jpg",
    genres: ["Action", "Adventure", "Comedy", "Drama", "Shounen"],
    authors: ["Oda, Eiichiro"],
    serializations: ["Weekly Shounen Jump"],
    themes: ["Military"],
    demographics: ["Shounen"]
  },
  {
    id: "3",
    mal_id: 642,
    title: "Vagabond",
    title_english: "Vagabond",
    title_japanese: "バガボンド",
    synopsis: "In 16th-century Japan, Shinmen Takezou is a wild, rough young man, in both his appearance and his actions. His aggressive nature has won him the collective reproach and fear of his village, leading him and his best friend, Matahachi Honiden, to run away in search of something grander than provincial life.",
    type: "Manga",
    chapters: 327,
    volumes: 37,
    status: "Hiatus",
    published_from: "1998-09-03",
    score: 9.2,
    scored_by: 120000,
    rank: 3,
    popularity: 3,
    members: 280000,
    favorites: 32000,
    image_url: "https://cdn.myanimelist.net/images/manga/1/259070.jpg",
    genres: ["Action", "Adventure", "Drama", "Historical", "Seinen"],
    authors: ["Inoue, Takehiko"],
    serializations: ["Morning"],
    themes: ["Martial Arts", "Samurai"],
    demographics: ["Seinen"]
  }
];

export const genres = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", 
  "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", 
  "Thriller", "Historical", "School", "Military", "Martial Arts", "Samurai",
  "Detective", "Time Travel", "Mythology", "Team Sports", "Survival"
];

export const animeStatuses = [
  "Airing", "Finished Airing", "Not yet aired"
];

export const mangaStatuses = [
  "Publishing", "Finished", "Hiatus", "Discontinued"
];

export const listStatuses = {
  anime: [
    { value: "watching", label: "Watching" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
    { value: "plan_to_watch", label: "Plan to Watch" }
  ],
  manga: [
    { value: "reading", label: "Reading" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
    { value: "plan_to_read", label: "Plan to Read" }
  ]
};