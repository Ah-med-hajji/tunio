# Database migrations

Plain `.sql` files, numbered `V{date}_{seq}__{slug}.sql`. Apply them in order against the `visite` schema.

Apply manually (no Flyway / Liquibase yet — future work):

```bash
mysql -u root visite < middleoffice/db/migrations/V2026_05_27_001__phase3_baseline.sql
```

Hibernate's `ddl-auto: update` will keep the rest of the schema in sync with the JPA entities on next boot. **You must run V2026_05_27_001 once before the new backend starts**, otherwise the `reservations` table will reject inserts (the orphan `user_id` column is NOT NULL in the existing dump).
