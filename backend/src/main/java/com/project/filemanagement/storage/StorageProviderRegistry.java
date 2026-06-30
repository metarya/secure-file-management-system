package com.project.filemanagement.storage;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.project.filemanagement.storage.StorageModels.StorageException;

/**
 * Resolves a {@link StorageProvider} by {@link StorageProviderType}. Spring
 * injects every provider bean and this registry indexes them, so business code
 * selects a backend with {@code registry.get(type)} and never branches on the
 * concrete provider.
 */
@Component
public class StorageProviderRegistry {

    private final Map<StorageProviderType, StorageProvider> providers =
            new EnumMap<>(StorageProviderType.class);

    public StorageProviderRegistry(List<StorageProvider> providerBeans) {
        for (StorageProvider provider : providerBeans) {
            providers.put(provider.getType(), provider);
        }
    }

    public StorageProvider get(StorageProviderType type) {
        StorageProvider provider = providers.get(type);
        if (provider == null) {
            throw new StorageException("No storage provider registered for type " + type);
        }
        return provider;
    }
}
