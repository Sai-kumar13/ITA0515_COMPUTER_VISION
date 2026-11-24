"""
Authentication module for Brain Tumor Detection application.
Handles user registration, login, and JWT token management.
"""

import os
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_db

SECRET_KEY = os.environ.get('SECRET_KEY', 'brain-tumor-detection-secret-key-2024')


def register_user(username, email, password):
    """
    Register a new user.

    Args:
        username: User's username
        email: User's email address
        password: User's plain-text password

    Returns:
        dict: {success: True, data: user_dict} or {success: False, error: message}
    """
    # Validate inputs
    if not username or not username.strip():
        return {'success': False, 'error': 'Username is required'}

    if not email or not email.strip():
        return {'success': False, 'error': 'Email is required'}

    if not password or len(password) < 6:
        return {'success': False, 'error': 'Password must be at least 6 characters'}

    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email.strip()):
        return {'success': False, 'error': 'Invalid email format'}

    username = username.strip()
    email = email.strip().lower()

    # Hash the password
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        conn.commit()

        user = {
            'id': cursor.lastrowid,
            'username': username,
            'email': email
        }

        return {'success': True, 'data': user}

    except sqlite3.IntegrityError as e:
        error_msg = str(e).lower()
        if 'username' in error_msg:
            return {'success': False, 'error': 'Username already exists'}
        elif 'email' in error_msg:
            return {'success': False, 'error': 'Email already registered'}
        else:
            return {'success': False, 'error': 'User already exists'}
    except sqlite3.Error as e:
        return {'success': False, 'error': f'Database error: {str(e)}'}
    finally:
        conn.close()


def login_user(username, password):
    """
    Authenticate a user and return a JWT token.

    Args:
        username: User's username
        password: User's plain-text password

    Returns:
        dict: {success: True, data: {user, token}} or {success: False, error: message}
    """
    if not username or not password:
        return {'success': False, 'error': 'Username and password are required'}

    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username.strip(),))
        row = cursor.fetchone()

        if row is None:
            return {'success': False, 'error': 'Invalid username or password'}

        if not check_password_hash(row['password_hash'], password):
            return {'success': False, 'error': 'Invalid username or password'}

        # Generate JWT token
        token_payload = {
            'user_id': row['id'],
            'username': row['username'],
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm='HS256')

        user = {
            'id': row['id'],
            'username': row['username'],
            'email': row['email']
        }

        return {
            'success': True,
            'data': {
                'user': user,
                'token': token
            }
        }

    except sqlite3.Error as e:
        return {'success': False, 'error': f'Database error: {str(e)}'}
    finally:
        conn.close()


def token_required(f):
    """
    Decorator to protect routes that require authentication.
    Extracts the user from the Authorization Bearer token.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({
                'success': False,
                'error': 'Authentication token is required'
            }), 401

        try:
            # Decode the token
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')

            # Fetch the user from the database
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT id, username, email FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            conn.close()

            if row is None:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 401

            current_user = {
                'id': row['id'],
                'username': row['username'],
                'email': row['email']
            }

        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'error': 'Token has expired. Please log in again.'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'error': 'Invalid token. Please log in again.'
            }), 401

        return f(current_user, *args, **kwargs)

    return decorated
