import type { Meta, StoryObj } from '@storybook/react';
import { AnimeCard } from './AnimeCard';

const meta: Meta<typeof AnimeCard> = {
  title: 'Features/AnimeCard',
  component: AnimeCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A card component for displaying anime information with interactive features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    anime: {
      description: 'Anime data object',
      control: { type: 'object' },
    },
    onClick: {
      description: 'Click handler for the card',
      action: 'clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample anime data for stories
const sampleAnime = {
  id: '1',
  anilist_id: 20958,
  title: 'Shingeki no Kyojin',
  title_english: 'Attack on Titan',
  title_japanese: '進撃の巨人',
  synopsis: 'Humanity fights for survival against the mysterious Titans.',
  image_url: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
  score: 8.7,
  anilist_score: 87,
  rank: 1,
  popularity: 1,
  favorites: 200000,
  year: 2013,
  color_theme: '#8B4513',
  type: 'TV' as const,
  status: 'Finished Airing' as const,
  genres: ['Action', 'Drama', 'Fantasy'],
  members: 2000000,
  anime_details: {
    episodes: 25,
    duration: 24,
    aired_from: '2013-04-07',
    aired_to: '2013-09-28',
    season: 'Spring',
    status: 'Finished Airing',
    type: 'TV',
    trailer_url: 'https://www.youtube.com/watch?v=8OkpRK2_gVs',
    next_episode_date: null,
  },
  studios: ['WIT Studio'],
};

export const Default: Story = {
  args: {
    anime: sampleAnime,
  },
};

export const WithoutAddToList: Story = {
  args: {
    anime: sampleAnime,
  },
};

export const HighRated: Story = {
  args: {
    anime: {
      ...sampleAnime,
      score: 9.5,
      anilist_score: 95,
      rank: 1,
      title: 'Perfect Anime',
      title_english: 'Perfect Anime',
    },
  },
};

export const LowRated: Story = {
  args: {
    anime: {
      ...sampleAnime,
      score: 5.2,
      anilist_score: 52,
      rank: 5000,
      title: 'Average Anime',
      title_english: 'Average Anime',
    },
  },
};