# Offer Lanka — Entity Relationship Diagram

Matches `database/schema.sql` and NestJS TypeORM entities.

```mermaid
erDiagram
  roles ||--o{ users : "assigned"
  users ||--o| businesses : "owns"
  users ||--o{ favorites : "saves"
  users ||--o{ notifications : "receives"
  users ||--o{ reviews : "writes"

  districts ||--o{ cities : "contains"
  cities ||--o{ stores : "located_in"
  cities ||--o{ businesses : "located_in"
  cities ||--o{ offers : "scoped"

  categories ||--o{ categories : "parent"
  categories ||--o{ offers : "classifies"

  businesses ||--o{ stores : "operates"
  businesses ||--o{ offers : "publishes"

  offers ||--o{ offer_images : "has"
  offers ||--o{ favorites : "favorited"
  offers ||--o{ reviews : "reviewed"

  roles {
    CHAR id PK
    ENUM name UK
    VARCHAR description
  }

  users {
    CHAR id PK
    VARCHAR name
    VARCHAR email UK
    VARCHAR password_hash
    VARCHAR phone
    CHAR role_id FK
    BOOLEAN is_active
  }

  businesses {
    CHAR id PK
    VARCHAR name
    ENUM status
    CHAR owner_id FK
    CHAR city_id FK
  }

  stores {
    CHAR id PK
    VARCHAR name
    DECIMAL latitude
    DECIMAL longitude
    CHAR business_id FK
    CHAR city_id FK
  }

  categories {
    CHAR id PK
    VARCHAR name
    VARCHAR slug UK
    CHAR parent_id FK
  }

  offers {
    CHAR id PK
    VARCHAR title
    DECIMAL discount_percent
    DATETIME start_date
    DATETIME end_date
    VARCHAR coupon_code
    ENUM status
    INT views
    INT likes
    CHAR business_id FK
    CHAR category_id FK
    CHAR city_id FK
  }

  offer_images {
    CHAR id PK
    VARCHAR image_url
    CHAR offer_id FK
  }

  favorites {
    CHAR id PK
    CHAR user_id FK
    CHAR offer_id FK
  }

  notifications {
    CHAR id PK
    VARCHAR title
    ENUM type
    CHAR user_id FK
  }

  reviews {
    CHAR id PK
    INT rating
    CHAR user_id FK
    CHAR offer_id FK
  }

  cities {
    CHAR id PK
    VARCHAR name
    CHAR district_id FK
  }

  districts {
    CHAR id PK
    VARCHAR name
    VARCHAR province
  }

  analytics {
    CHAR id PK
    VARCHAR event_type
    VARCHAR entity_id
  }

  audit_logs {
    CHAR id PK
    VARCHAR action
    VARCHAR entity_type
  }
```

## Audit columns (all main tables)

- `created_by`, `updated_by`
- `created_date`, `updated_date`
- `is_deleted` (soft delete)
