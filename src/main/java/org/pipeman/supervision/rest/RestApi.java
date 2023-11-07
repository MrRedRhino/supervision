package org.pipeman.supervision.rest;

import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.validation.JavalinValidation;
import org.pipeman.supervision.Database;
import org.pipeman.supervision.NameRepository;

import java.time.LocalDate;
import java.util.Optional;

public class RestApi {
    static {
        JavalinValidation.register(LocalDate.class, s -> {
            String[] split = s.split("-");
            int year = Integer.parseInt(split[0]);
            int month = Integer.parseInt(split[1]);
            int day = Integer.parseInt(split[2]);
            return LocalDate.of(year, month, day);
        });
    }

    public static void getSupervisions(Context ctx) {
        ctx.json(Database.getSupervisions());
    }

    public static void deleteSupervision(Context ctx) {
        LocalDate date = ctx.pathParamAsClass("date", LocalDate.class).get();
        int breakNumber = ctx.queryParamAsClass("break", Integer.class).get();
        String name = Optional.ofNullable(ctx.queryParam("name")).orElse("");
        if (!NameRepository.getNames().contains(name)) throw new BadRequestResponse("Unknown name");

        boolean deleted = Database.deleteSupervision(breakNumber, date, name);
        if (!deleted) {
            throw new BadRequestResponse("No entry found");
        }
    }

    public static void putSupervision(Context ctx) {
        LocalDate date = ctx.pathParamAsClass("date", LocalDate.class).get();
        if (date.getDayOfWeek().getValue() >= 6) throw new BadRequestResponse("This date is on a weekend");

        int breakNumber = ctx.queryParamAsClass("break", Integer.class).get();
        if (breakNumber < 1 || breakNumber > 2) throw new BadRequestResponse("Invalid break");
        String name = Optional.ofNullable(ctx.queryParam("name")).orElse("");
        if (!NameRepository.getNames().contains(name)) throw new BadRequestResponse("Unknown name");
        // TODO Ensure that break num is valid

        boolean put = Database.putSupervision(breakNumber, date, name);
        if (!put) {
            throw new BadRequestResponse("Could not add appointment");
        }
    }

    public static void getPlannedSupervisions(Context ctx) {
        String name = ctx.pathParam("name");
        if (!NameRepository.getNames().contains(name)) throw new BadRequestResponse("Unknown name");

        ctx.json(Database.getSupervisions(name));
    }
}
