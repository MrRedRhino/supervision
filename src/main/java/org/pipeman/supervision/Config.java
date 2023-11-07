package org.pipeman.supervision;

import org.pipeman.pconf.AbstractConfig;

import java.nio.file.Path;

public class Config extends AbstractConfig {
    private static final Config INSTANCE = new Config("config.properties");
    public final String dbUser = get("db-user", "");
    public final String dbPassword = get("db-password", "");
    public final String dbUrl = get("db-url", "");
    public final int apiPort = get("api-port", 4000);

    public Config(String file) {
        super(file);
        store(Path.of("config.properties"), "");
    }

    public static Config get() {
        return INSTANCE;
    }
}
