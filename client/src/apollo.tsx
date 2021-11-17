import { ApolloClient, InMemoryCache } from "@apollo/client";

const kardsApi = "https://api.kards.com/graphql";

const client = new ApolloClient({
  uri: kardsApi,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default client;
