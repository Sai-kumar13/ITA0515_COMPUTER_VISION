"""
Database module for Brain Tumor Detection application.
Handles SQLite database setup and connection management.
"""

import sqlite3
import os

# Database path relative to the backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, '..', 'brain_tumor.db')


def get_db():
    """Get a database connection with row factory enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initialize the database by creating tables if they don't exist."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Create USERS table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create PREDICTIONS table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                image_path TEXT NOT NULL,
                predicted_class TEXT NOT NULL,
                prediction_probability REAL NOT NULL,
                processing_time REAL NOT NULL,
                grad_cam_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        conn.commit()
        print(f"[Database] Initialized successfully at {os.path.abspath(DATABASE_PATH)}")
    except sqlite3.Error as e:
        print(f"[Database] Error initializing database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    init_db()
    print("Database tables created successfully.")
