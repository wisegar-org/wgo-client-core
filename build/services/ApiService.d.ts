import { ApolloQueryResult, MutationOptions, OperationVariables, QueryOptions } from "apollo-client";
export interface ApiServiceOptions {
    onTokenRefresh: (headers: any) => void;
    onNotAuthorizedErrorHandler: (message: any) => void;
    onGenericErrorHandler: (message: any) => void;
    onGetAuthToken: () => string;
    onGetBaseUrl: () => string;
}
export declare class ApiService {
    private options;
    private apolloClient;
    private static instance;
    private constructor();
    private getApolloClientOptions;
    static GetInstance(options: ApiServiceOptions): ApiService;
    mutate<T = any, TVariables = OperationVariables>(options: MutationOptions<T, TVariables>): Promise<any>;
    query<T = any, TVariables = OperationVariables>(options: QueryOptions<TVariables>): Promise<ApolloQueryResult<T>>;
}
//# sourceMappingURL=ApiService.d.ts.map