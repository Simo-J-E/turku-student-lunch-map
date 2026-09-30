CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  city TEXT NOT NULL DEFAULT 'Turku',
  area TEXT,
  campus TEXT,
  chain TEXT,
  website_url TEXT NOT NULL,
  menu_url TEXT NOT NULL,
  student_discount_available INTEGER NOT NULL DEFAULT 1,
  student_meal_type TEXT NOT NULL DEFAULT 'KELA_SUBSIDIZED',
  student_price REAL,
  premium_student_price REAL,
  normal_price REAL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  opening_hours TEXT,
  lunch_hours TEXT,
  vegetarian_available INTEGER NOT NULL DEFAULT 0,
  vegan_available INTEGER NOT NULL DEFAULT 0,
  gluten_free_available INTEGER NOT NULL DEFAULT 0,
  source_url TEXT NOT NULL,
  price_source_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  price_last_checked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);

CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  source_url TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  source_updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_date ON menus(restaurant_id,date);

CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL,
  student_price REAL,
  category TEXT NOT NULL,
  diets_json TEXT NOT NULL DEFAULT '[]',
  allergens_json TEXT NOT NULL DEFAULT '[]'
);
