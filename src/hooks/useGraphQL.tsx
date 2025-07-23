import { useQuery, useMutation } from '@apollo/client';
import { gql } from 'graphql-tag';

export const ANIME_DETAIL_QUERY = gql`
  query AnimeDetail($id: ID!) {
    anime(id: $id) {
      id
      title
      titleEnglish
      synopsis
      imageUrl
      score
      episodes
      status
      year
      genres
      studios
      userList {
        status
        score
        progress
        notes
      }
    }
  }
`;

export const ANIME_LIST_QUERY = gql`
  query AnimeList($filter: AnimeFilter, $page: Int, $limit: Int) {
    animeList(filter: $filter, page: $page, limit: $limit) {
      items {
        id
        title
        imageUrl
        score
        episodes
        year
      }
      pageInfo {
        total
        currentPage
        hasNextPage
      }
    }
  }
`;

export const UPDATE_ANIME_STATUS = gql`
  mutation UpdateAnimeStatus($animeId: ID!, $status: String!, $score: Int, $progress: Int) {
    updateAnimeStatus(animeId: $animeId, status: $status, score: $score, progress: $progress) {
      status
      score
      progress
    }
  }
`;

export const useAnimeDetail = (id: string) => {
  return useQuery(ANIME_DETAIL_QUERY, { 
    variables: { id },
    skip: !id,
  });
};

export const useAnimeList = (filter = {}, page = 1) => {
  return useQuery(ANIME_LIST_QUERY, {
    variables: { filter, page, limit: 20 },
  });
};

export const useUpdateAnimeStatus = () => {
  return useMutation(UPDATE_ANIME_STATUS, {
    refetchQueries: ['AnimeDetail', 'MyAnimeList'],
  });
};