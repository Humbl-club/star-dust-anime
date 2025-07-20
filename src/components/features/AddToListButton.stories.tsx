import type { Meta, StoryObj } from '@storybook/react';
import { AddToListButton } from './AddToListButton';

const meta: Meta<typeof AddToListButton> = {
  title: 'Features/AddToListButton',
  component: AddToListButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A button component for adding anime/manga to user lists with status selection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      description: 'Content type',
      control: { type: 'select' },
      options: ['anime', 'manga'],
    },
    variant: {
      description: 'Button variant',
      control: { type: 'select' },
      options: ['default', 'outline', 'ghost'],
    },
    size: {
      description: 'Button size',
      control: { type: 'select' },
      options: ['sm', 'default', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleAnime = {
  id: '1',
  anilist_id: 20958,
  title: 'Attack on Titan',
  synopsis: 'Humanity fights for survival against the mysterious Titans.',
  image_url: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
  score: 8.7,
  type: 'TV' as const,
  status: 'Finished Airing' as const,
  genres: ['Action', 'Drama', 'Fantasy'],
};

const sampleManga = {
  id: '1',
  anilist_id: 53390,
  title: 'Shingeki no Kyojin',
  synopsis: 'Humanity fights for survival against the mysterious Titans.',
  image_url: 'https://cdn.myanimelist.net/images/manga/2/37846.jpg',
  score: 8.9,
  type: 'Manga' as const,
  status: 'Finished' as const,
  genres: ['Action', 'Drama', 'Fantasy'],
};

export const AnimeDefault: Story = {
  args: {
    item: sampleAnime,
    type: 'anime',
    variant: 'outline',
    size: 'sm',
  },
};

export const MangaDefault: Story = {
  args: {
    item: sampleManga,
    type: 'manga',
    variant: 'outline',
    size: 'sm',
  },
};

export const LargeButton: Story = {
  args: {
    item: sampleAnime,
    type: 'anime',
    variant: 'default',
    size: 'lg',
  },
};

export const GhostVariant: Story = {
  args: {
    item: sampleAnime,
    type: 'anime',
    variant: 'ghost',
    size: 'default',
  },
};