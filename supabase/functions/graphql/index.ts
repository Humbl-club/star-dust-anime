import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const typeDefs = `
  type Anime {
    id: ID!
    title: String!
    titleEnglish: String
    titleJapanese: String
    synopsis: String
    imageUrl: String
    score: Float
    episodes: Int
    status: String
    year: Int
    genres: [String]
    studios: [String]
    userList: UserAnimeList
  }

  type UserAnimeList {
    status: String
    score: Int
    progress: Int
    notes: String
  }

  type PageInfo {
    total: Int
    perPage: Int
    currentPage: Int
    hasNextPage: Boolean
  }

  type AnimePage {
    items: [Anime]
    pageInfo: PageInfo
  }

  input AnimeFilter {
    search: String
    genre: String
    year: Int
    status: String
    minScore: Float
    sortBy: String
    order: String
  }

  type Query {
    anime(id: ID!): Anime
    animeList(filter: AnimeFilter, page: Int, limit: Int): AnimePage
    myAnimeList(status: String): [Anime]
    recommendations(contentType: String!): [Anime]
  }

  type Mutation {
    updateAnimeStatus(animeId: ID!, status: String!, score: Int, progress: Int): UserAnimeList
    rateAnime(animeId: ID!, score: Int!): Anime
  }
`;

const resolvers = {
  Query: {
    anime: async (_: any, { id }: { id: string }, context: any) => {
      const { data } = await supabase
        .from('anime')
        .select('*')
        .eq('id', id)
        .single();
      
      return data;
    },
    
    animeList: async (_: any, { filter = {}, page = 1, limit = 20 }: any) => {
      let query = supabase.from('anime').select('*', { count: 'exact' });
      
      if (filter.search) {
        query = query.ilike('title', `%${filter.search}%`);
      }
      if (filter.genre) {
        query = query.contains('genres', [filter.genre]);
      }
      if (filter.year) {
        query = query.eq('year', filter.year);
      }
      if (filter.minScore) {
        query = query.gte('score', filter.minScore);
      }
      
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);
      
      if (filter.sortBy) {
        query = query.order(filter.sortBy, { ascending: filter.order !== 'desc' });
      }
      
      const { data, count } = await query;
      
      return {
        items: data || [],
        pageInfo: {
          total: count || 0,
          perPage: limit,
          currentPage: page,
          hasNextPage: from + limit < (count || 0)
        }
      };
    },
    
    myAnimeList: async (_: any, { status }: any, context: any) => {
      if (!context.userId) throw new Error('Unauthorized');
      
      let query = supabase
        .from('user_anime_lists')
        .select('*, anime(*)')
        .eq('user_id', context.userId);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data } = await query;
      return data?.map(item => ({ ...item.anime, userList: item })) || [];
    },
  },
  
  Mutation: {
    updateAnimeStatus: async (_: any, args: any, context: any) => {
      if (!context.userId) throw new Error('Unauthorized');
      
      const { data } = await supabase
        .from('user_anime_lists')
        .upsert({
          user_id: context.userId,
          anime_id: args.animeId,
          status: args.status,
          score: args.score,
          progress: args.progress,
        })
        .select()
        .single();
      
      return data;
    },
  },
  
  Anime: {
    userList: async (parent: any, _: any, context: any) => {
      if (!context.userId) return null;
      
      const { data } = await supabase
        .from('user_anime_lists')
        .select('*')
        .eq('user_id', context.userId)
        .eq('anime_id', parent.id)
        .single();
      
      return data;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

serve(async (req) => {
  const { pathname } = new URL(req.url);
  
  // Extract user ID from auth header
  const authHeader = req.headers.get('authorization');
  let userId = null;
  
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    userId = user?.id;
  }
  
  return await GraphQLHTTP<Request>({
    schema,
    graphiql: pathname === '/graphql',
    context: { userId },
  })(req);
});