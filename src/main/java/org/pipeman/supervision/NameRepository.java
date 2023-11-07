package org.pipeman.supervision;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;

public class NameRepository {
    private static final List<String> names;

    static {
        try {
            names = Files.readAllLines(Path.of("names.txt"));
            names.removeIf(String::isBlank);
            Collections.sort(names);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static List<String> getNames() {
        return List.copyOf(names);
    }
}
