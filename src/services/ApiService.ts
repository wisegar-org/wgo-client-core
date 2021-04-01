import {
  ApolloClient,
  ApolloQueryResult,
  MutationOptions,
  OperationVariables,
  QueryOptions,
} from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloLink, from } from "apollo-link";
import { onError } from "apollo-link-error";
import { Agent } from "https";

export interface ApiServiceOptions {
  onTokenRefresh: (headers: any) => void;
  onNotAuthorizedErrorHandler: (message: any) => void;
  onGenericErrorHandler: (message: any) => void;
  onGetAuthToken: () => string;
  onGetBaseUrl: () => string;
}

export class ApiService {
  private options: ApiServiceOptions;
  private apolloClient!: ApolloClient<NormalizedCacheObject>;
  private static instance: ApiService;

  private constructor(options: ApiServiceOptions) {
    this.options = options;
    this.apolloClient = new ApolloClient<NormalizedCacheObject>(
      this.getApolloClientOptions(options)
    );
  }

  private getApolloClientOptions(options: ApiServiceOptions) {
    const authMiddleware = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          authorization: this.options.onGetAuthToken(), // localStorage.getItem(ApiSettings.KEY_AUTH_TOKEN) || null,
        },
      });
      return forward(operation);
    });

    const httpLink = new HttpLink({
      uri: this.options.onGetBaseUrl(), // ApiSettings.API_BASE,
      fetchOptions: {
        agent: new Agent({ rejectUnauthorized: false }),
      },
    });

    const afterwareLink = new ApolloLink((operation, forward) => {
      return forward(operation).map((response) => {
        const context = operation.getContext();
        const {
          response: { headers },
        } = context;
        console.log("Response apollo link logger: ", response);
        this.options.onTokenRefresh(headers);
        //   if (headers) {
        //     const refreshedToken = headers.get(
        //       LocalStorageSettings.KEY_AUTH_REFRESH_TOKEN
        //     );
        //     if (refreshedToken) {
        //       localStorage.setItem(ApiSettings.KEY_AUTH_TOKEN, refreshedToken);
        //     }
        //   }

        return response;
      });
    });

    //   private GenericErrorHandler = (message: string) => {
    //     if (message === "Not Authorized") return;
    //     alert(`Api Response Error: ${message}`);
    //   };

    //   private NotAuthorizedErrorHandler = (message: string) => {
    //     if (message !== "Not Authorized") return;
    //     alert(`Api Response Error: ${message}`);
    //     ApiService.store.commit(
    //       `${userNamespace}/${userMutations.setLoggedUser}`,
    //       null
    //     );
    //     ApiService.store.$router.push("/login");
    //   };
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) => {
          this.options.onGenericErrorHandler(message);
          this.options.onNotAuthorizedErrorHandler(message);
        });
      }

      if (networkError) {
        console.log(`[Network error]: ${networkError}`);
      }
    });

    return {
      link: from([authMiddleware, afterwareLink, errorLink, httpLink]),
      cache: new InMemoryCache(),
    };
  }

  public static GetInstance(options?: ApiServiceOptions): ApiService {
    if (!ApiService.instance && options) {
      ApiService.instance = new ApiService(options);
    }
    if (!ApiService.instance && !options) {
      throw Error("Options param not found!");
    }
    return ApiService.instance;
  }

  public mutate<T = any, TVariables = OperationVariables>(
    options: MutationOptions<T, TVariables>
  ): Promise<any> {
    return this.apolloClient.mutate(options);
  }
  public query<T = any, TVariables = OperationVariables>(
    options: QueryOptions<TVariables>
  ): Promise<ApolloQueryResult<T>> {
    return this.apolloClient.query(options);
  }
}
