package org.pipeman.supervision.rest;

import io.javalin.http.Context;
import org.pipeman.supervision.NameRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class NameApi {
    public static void getNames(Context ctx) {
        List<String> names = NameRepository.getNames();
        List<String> filteredNames = new ArrayList<>();

        String filter = Optional.ofNullable(ctx.queryParam("filter")).orElse("").toLowerCase();

        for (String name : names) {
            if (name.toLowerCase().startsWith(filter)) {
                filteredNames.add(name);
            }
        }
        ctx.json(filteredNames);
    }
}
