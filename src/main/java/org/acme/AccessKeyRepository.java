package org.acme;

import java.util.Optional;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AccessKeyRepository implements PanacheMongoRepository<AccessKey> {

    public Optional<AccessKey> findByKey(String key) {
        return find("key", key).firstResultOptional();
    }
}