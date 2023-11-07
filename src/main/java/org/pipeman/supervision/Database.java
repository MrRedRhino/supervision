package org.pipeman.supervision;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.reflect.ConstructorMapper;

import java.beans.ConstructorProperties;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Database {
    private static final Jdbi JDBI;

    static {
        HikariConfig config = new HikariConfig();
        config.setUsername(Config.get().dbUser);
        config.setPassword(Config.get().dbPassword);
        config.setJdbcUrl(Config.get().dbUrl);

        JDBI = Jdbi.create(new HikariDataSource(config));
        JDBI.registerRowMapper(ConstructorMapper.factory(Supervision.class));
        JDBI.registerRowMapper(ConstructorMapper.factory(PlannedSupervision.class));
    }

    public static Map<LocalDate, Map<Integer, List<String>>> getSupervisions() {
        Map<LocalDate, Map<Integer, List<String>>> supervisions = new HashMap<>();

        List<Supervision> result = JDBI.withHandle(h -> h.createQuery("""
                        SELECT date, array_agg(name) AS names, break_num
                        FROM supervisions
                        GROUP BY date, break_num;
                        """)
                .mapTo(Supervision.class)
                .list());

        for (Supervision supervision : result) {
            Map<Integer, List<String>> supervisors = supervisions.get(supervision.date());
            if (supervisors == null) {
                Map<Integer, List<String>> newMap = new HashMap<>();
                newMap.put(supervision.breakNum(), supervision.names());
                supervisions.put(supervision.date(), newMap);
            } else {
                supervisors.computeIfAbsent(supervision.breakNum(), i -> new ArrayList<>())
                        .addAll(supervision.names());
            }
        }
        return supervisions;
    }

    public static boolean deleteSupervision(int breakNumber, LocalDate date, String name) {
        int updateCount = JDBI.withHandle(h -> h.createUpdate("""
                        DELETE
                        FROM supervisions
                        WHERE break_num = :break_num
                          AND date = :date
                          AND name = :name
                        """)
                .bind("break_num", breakNumber)
                .bind("date", date)
                .bind("name", name)
                .execute()
        );

        return updateCount > 0;
    }

    public static boolean putSupervision(int breakNumber, LocalDate date, String name) {
        int updateCount = JDBI.withHandle(h -> h.createUpdate("""
                        INSERT INTO supervisions (break_num, date, name)
                        SELECT :break_num, :date, :name
                        WHERE NOT exists(SELECT 1 FROM supervisions WHERE date = :date AND break_num = :break_num AND name = :name)
                          AND (SELECT count(*)
                               FROM supervisions
                               WHERE break_num = :break_num
                                 AND date = :date) < 2;
                        """)
                .bind("date", date)
                .bind("break_num", breakNumber)
                .bind("name", name)
                .execute());

        return updateCount > 0;
    }

    public static List<PlannedSupervision> getSupervisions(String name) {
        return JDBI.withHandle(h -> h.createQuery("""
                        SELECT date, break_num
                        FROM supervisions
                        WHERE name = :name
                        ORDER BY date, break_num
                        """)
                .bind("name", name)
                .mapTo(PlannedSupervision.class)
                .list());
    }

    public record Supervision(LocalDate date, List<String> names, int breakNum) {
        @ConstructorProperties({"date", "names", "break_num"})
        public Supervision {
        }
    }

    public record PlannedSupervision(@JsonSerialize(using = LocalDateSerializer.class) LocalDate date, @JsonProperty("break-num") int breakNum) {
        @ConstructorProperties({"date", "break_num"})
        public PlannedSupervision {
        }
    }
}
