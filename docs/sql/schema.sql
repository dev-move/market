-- Market DB Schema
-- MariaDB 10.11
-- 테이블: users, regions, categories, items, item_images, favorites, chat_rooms, chat_messages

USE market;

-- 1. 지역 (시/구/동 리스트)
CREATE TABLE IF NOT EXISTS regions (
    id         INT         AUTO_INCREMENT PRIMARY KEY,
    city       VARCHAR(20) NOT NULL COMMENT '시',
    district   VARCHAR(20) NOT NULL COMMENT '구',
    dong       VARCHAR(30) NOT NULL COMMENT '동',
    code       VARCHAR(10) NOT NULL UNIQUE COMMENT '행정동 코드',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 회원
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NULL COMMENT 'legacy compatibility column',
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(30)  NOT NULL UNIQUE,
    region_id     INT          NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 카테고리 (관리자 관리, 계층형)
CREATE TABLE IF NOT EXISTS categories (
    id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50)  NOT NULL,
    parent_id  BIGINT       DEFAULT NULL COMMENT '부모 카테고리 ID',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 상품 (items)
CREATE TABLE IF NOT EXISTS items (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT       NOT NULL COMMENT '판매자',
    region_id      INT          NOT NULL COMMENT '거래 동네',
    category_id    BIGINT       NULL,
    title          VARCHAR(100) NOT NULL,
    description    TEXT,
    price          INT          NOT NULL DEFAULT 0,
    status         ENUM('selling','reserved','sold') NOT NULL DEFAULT 'selling' COMMENT '판매중/예약중/판매완료',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (region_id)   REFERENCES regions(id)    ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 상품 이미지 (item_images)
CREATE TABLE IF NOT EXISTS item_images (
    id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
    item_id    BIGINT       NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 관심 상품 (favorites)
CREATE TABLE IF NOT EXISTS favorites (
    id         BIGINT   AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT   NOT NULL,
    item_id    BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_favorite_user_item (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 채팅방
CREATE TABLE IF NOT EXISTS chat_rooms (
    id         BIGINT   AUTO_INCREMENT PRIMARY KEY,
    item_id    BIGINT   NOT NULL,
    buyer_id   BIGINT   NOT NULL,
    seller_id  BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_chat_room_item_buyer (item_id, buyer_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 채팅 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
    id         BIGINT   AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT   NOT NULL,
    sender_id  BIGINT   NOT NULL,
    message    TEXT     NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 거래 후기
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGINT   AUTO_INCREMENT PRIMARY KEY,
    item_id      BIGINT   NOT NULL,
    reviewer_id  BIGINT   NOT NULL,
    seller_id    BIGINT   NOT NULL,
    score        INT      NOT NULL,
    comment      TEXT     NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_item_reviewer (item_id, reviewer_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 신고
CREATE TABLE IF NOT EXISTS reports (
    id           BIGINT   AUTO_INCREMENT PRIMARY KEY,
    item_id      BIGINT   NOT NULL,
    reporter_id  BIGINT   NOT NULL,
    reason       VARCHAR(100) NOT NULL,
    detail       TEXT     NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_note   TEXT     NULL,
    reviewed_at  DATETIME NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
