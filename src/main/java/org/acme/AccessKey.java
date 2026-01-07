package org.acme;

import java.time.Instant;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "accesskeys")
public class AccessKey extends PanacheMongoEntity {

    public String key;
    public KeyRole role;
    public String label;
    public String userId;
    public String displayName;
    public Instant createdAt = Instant.now();

    public enum KeyRole {
        USER,
        ADMIN,
        KEY_MANAGER
    }
}