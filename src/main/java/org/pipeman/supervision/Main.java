package org.pipeman.supervision;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import org.pipeman.supervision.rest.NameApi;
import org.pipeman.supervision.rest.RestApi;

import static io.javalin.apibuilder.ApiBuilder.*;

public class Main {
    public static void main(String[] args) {
        Javalin app = Javalin.create(c -> c.showJavalinBanner = false);

        app.updateConfig(config -> config.staticFiles.add("static", Location.EXTERNAL));

        app.routes(() -> {
            path("api", () -> {
                get("names", NameApi::getNames);
                path("supervisions", () -> {
                    get(RestApi::getSupervisions);
                    delete("{date}", RestApi::deleteSupervision);
                    put("{date}", RestApi::putSupervision);
                    get("{name}", RestApi::getPlannedSupervisions);
                });
            });
        });

        app.start(Config.get().apiPort);
    }
}