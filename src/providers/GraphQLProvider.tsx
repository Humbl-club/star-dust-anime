import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';

export const GraphQLProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
};