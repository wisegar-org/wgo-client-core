"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
var apollo_client_1 = require("apollo-client");
var apollo_link_http_1 = require("apollo-link-http");
var apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
var apollo_link_1 = require("apollo-link");
var apollo_link_error_1 = require("apollo-link-error");
var https_1 = require("https");
var ApiService = /** @class */ (function () {
    function ApiService(options) {
        this.options = options;
        this.apolloClient = new apollo_client_1.ApolloClient(this.getApolloClientOptions(options));
    }
    ApiService.prototype.getApolloClientOptions = function (options) {
        var _this = this;
        var authMiddleware = new apollo_link_1.ApolloLink(function (operation, forward) {
            operation.setContext({
                headers: {
                    authorization: _this.options.onGetAuthToken(),
                },
            });
            return forward(operation);
        });
        var httpLink = new apollo_link_http_1.HttpLink({
            uri: this.options.onGetBaseUrl(),
            fetchOptions: {
                agent: new https_1.Agent({ rejectUnauthorized: false }),
            },
        });
        var afterwareLink = new apollo_link_1.ApolloLink(function (operation, forward) {
            return forward(operation).map(function (response) {
                var context = operation.getContext();
                var headers = context.response.headers;
                console.log("Response apollo link logger: ", response);
                _this.options.onTokenRefresh(headers);
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
        var errorLink = apollo_link_error_1.onError(function (_a) {
            var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError;
            if (graphQLErrors) {
                graphQLErrors.map(function (_a) {
                    var message = _a.message, locations = _a.locations, path = _a.path;
                    _this.options.onGenericErrorHandler(message);
                    _this.options.onNotAuthorizedErrorHandler(message);
                });
            }
            if (networkError) {
                console.log("[Network error]: " + networkError);
            }
        });
        return {
            link: apollo_link_1.from([authMiddleware, afterwareLink, errorLink, httpLink]),
            cache: new apollo_cache_inmemory_1.InMemoryCache(),
        };
    };
    ApiService.GetInstance = function (options) {
        if (!ApiService.instance && options) {
            ApiService.instance = new ApiService(options);
        }
        if (!ApiService.instance && !options) {
            throw Error("Options param not found!");
        }
        return ApiService.instance;
    };
    ApiService.prototype.mutate = function (options) {
        return this.apolloClient.mutate(options);
    };
    ApiService.prototype.query = function (options) {
        return this.apolloClient.query(options);
    };
    return ApiService;
}());
exports.ApiService = ApiService;
