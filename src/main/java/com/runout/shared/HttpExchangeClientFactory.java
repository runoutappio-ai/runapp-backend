package com.runout.shared;

import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

public final class HttpExchangeClientFactory {

    private HttpExchangeClientFactory() {
    }

    public static <T> T create(String baseUrl, Class<T> clientType) {
        return createProxyFactory(baseUrl).createClient(clientType);
    }

    public static HttpServiceProxyFactory createProxyFactory(String baseUrl) {
        var adapter = RestClientAdapter.create(RestClient.builder().baseUrl(baseUrl).build());
        return HttpServiceProxyFactory.builderFor(adapter).build();
    }
}
