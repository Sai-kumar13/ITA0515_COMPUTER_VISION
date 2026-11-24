"""
Main Flask application for Brain Tumor Detection.
Provides REST API endpoints for authentication, prediction, history, and analytics.
"""

import json
import os
import sys
import uuid
from datetime import datetime

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('KERAS_HOME', os.path.join(BASE_DIR, '..', '.keras'))
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from database import init_db, get_db
from auth import register_user, login_user, token_required
from preprocessing import validate_image
from prediction import predict, load_model, get_model, get_model_info
from gradcam import generate_gradcam

# Base directory paths
UPLOAD_DIR = os.path.join(BASE_DIR, '..', 'uploads')
GRADCAM_DIR = os.path.join(UPLOAD_DIR, 'gradcam')
REPORTS_DIR = os.path.join(BASE_DIR, '..', 'reports')

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(GRADCAM_DIR, exist_ok=True)

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'brain-tumor-detection-secret-key-2024')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

# Enable CORS for the React frontend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})


# ─────────────────────────────────────────────
# Auth Routes
# ─────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def api_register():
    """Register a new user."""
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'error': 'Request body is required'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username:
        return jsonify({'success': False, 'error': 'Username is required'}), 400
    if not email:
        return jsonify({'success': False, 'error': 'Email is required'}), 400
    if not password:
        return jsonify({'success': False, 'error': 'Password is required'}), 400

    result = register_user(username, email, password)

    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400


@app.route('/api/login', methods=['POST'])
def api_login():
    """Authenticate user and return JWT token."""
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'error': 'Request body is required'}), 400

    username = data.get('username', '')
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required'}), 400

    result = login_user(username, password)

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 401


@app.route('/api/logout', methods=['POST'])
def api_logout():
    """Logout user (JWT is stateless, so just acknowledge)."""
    return jsonify({'success': True, 'data': {'message': 'Logged out successfully'}}), 200


# ─────────────────────────────────────────────
# Prediction Routes
# ─────────────────────────────────────────────

@app.route('/api/predict', methods=['POST'])
@token_required
def api_predict(current_user):
    """Run brain tumor prediction on an uploaded MRI image."""
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']

    # Validate the image
    validation = validate_image(file)
    if not validation['valid']:
        return jsonify({'success': False, 'error': validation['error']}), 400

    try:
        # Generate unique filename and save
        extension = file.filename.rsplit('.', 1)[-1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        file.save(file_path)

        # Run prediction
        result = predict(file_path)

        if not result['success']:
            return jsonify(result), 500

        # Generate Grad-CAM visualization
        model = get_model()
        gradcam_filename = None
        if model is not None:
            gradcam_filename = generate_gradcam(model, file_path)

        # Save prediction to database
        conn = get_db()
        try:
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO predictions
                   (user_id, image_path, predicted_class, prediction_probability,
                    processing_time, grad_cam_path)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (
                    current_user['id'],
                    unique_filename,
                    result['predicted_class'],
                    result['probability'],
                    result['processing_time'],
                    gradcam_filename
                )
            )
            conn.commit()
            prediction_id = cursor.lastrowid
        except Exception as e:
            conn.rollback()
            return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
        finally:
            conn.close()

        return jsonify({
            'success': True,
            'data': {
                'id': prediction_id,
                'image_path': unique_filename,
                'predicted_class': result['predicted_class'],
                'probability': result['probability'],
                'prediction_probability': result['probability'],
                'processing_time': result['processing_time'],
                'grad_cam_path': gradcam_filename,
                'created_at': datetime.utcnow().isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction failed: {str(e)}'}), 500


# ─────────────────────────────────────────────
# History Routes
# ─────────────────────────────────────────────

@app.route('/api/history', methods=['GET'])
@token_required
def api_history(current_user):
    """Get prediction history for the current user."""
    # Query parameters
    search = request.args.get('search', '').strip()
    filter_class = request.args.get('filter', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Clamp values
    page = max(1, page)
    per_page = max(1, min(100, per_page))

    conn = get_db()
    try:
        cursor = conn.cursor()

        # Build query
        query = 'SELECT * FROM predictions WHERE user_id = ?'
        params = [current_user['id']]

        if search:
            query += ' AND (predicted_class LIKE ? OR image_path LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%'])

        if filter_class in ('Tumor', 'No Tumor'):
            query += ' AND predicted_class = ?'
            params.append(filter_class)

        # Get total count
        count_query = query.replace('SELECT *', 'SELECT COUNT(*)', 1)
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        # Add ordering and pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, (page - 1) * per_page])

        cursor.execute(query, params)
        rows = cursor.fetchall()

        predictions = []
        for row in rows:
            predictions.append({
                'id': row['id'],
                'image_path': row['image_path'],
                'predicted_class': row['predicted_class'],
                'probability': row['prediction_probability'],
                'prediction_probability': row['prediction_probability'],
                'processing_time': row['processing_time'],
                'grad_cam_path': row['grad_cam_path'],
                'created_at': row['created_at']
            })

        return jsonify({
            'success': True,
            'data': {
                'predictions': predictions,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': max(1, (total + per_page - 1) // per_page)
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/history/<int:id>', methods=['GET'])
@token_required
def api_history_detail(current_user, id):
    """Get a specific prediction for the current user."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM predictions WHERE id = ? AND user_id = ?',
            (id, current_user['id'])
        )
        row = cursor.fetchone()

        if row is None:
            return jsonify({'success': False, 'error': 'Prediction not found'}), 404

        prediction = {
            'id': row['id'],
            'image_path': row['image_path'],
            'predicted_class': row['predicted_class'],
            'probability': row['prediction_probability'],
            'prediction_probability': row['prediction_probability'],
            'processing_time': row['processing_time'],
            'grad_cam_path': row['grad_cam_path'],
            'created_at': row['created_at']
        }

        return jsonify({'success': True, 'data': prediction}), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/history/<int:id>', methods=['DELETE'])
@token_required
def api_history_delete(current_user, id):
    """Delete a specific prediction (only if it belongs to the current user)."""
    conn = get_db()
    try:
        cursor = conn.cursor()

        # Fetch the prediction
        cursor.execute(
            'SELECT * FROM predictions WHERE id = ? AND user_id = ?',
            (id, current_user['id'])
        )
        row = cursor.fetchone()

        if row is None:
            return jsonify({'success': False, 'error': 'Prediction not found'}), 404

        # Delete associated image files
        image_path = os.path.join(UPLOAD_DIR, row['image_path'])
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except OSError:
                pass

        if row['grad_cam_path']:
            gradcam_path = os.path.join(GRADCAM_DIR, row['grad_cam_path'])
            if os.path.exists(gradcam_path):
                try:
                    os.remove(gradcam_path)
                except OSError:
                    pass

        # Delete from database
        cursor.execute('DELETE FROM predictions WHERE id = ?', (id,))
        conn.commit()

        return jsonify({
            'success': True,
            'data': {'message': 'Prediction deleted successfully'}
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
    finally:
        conn.close()


# ─────────────────────────────────────────────
# Dashboard & Analytics Routes
# ─────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
@token_required
def api_dashboard(current_user):
    """Get dashboard data for the current user."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        user_id = current_user['id']

        # Total predictions
        cursor.execute('SELECT COUNT(*) FROM predictions WHERE user_id = ?', (user_id,))
        total_predictions = cursor.fetchone()[0]

        # Tumor count
        cursor.execute(
            "SELECT COUNT(*) FROM predictions WHERE user_id = ? AND predicted_class = 'Tumor'",
            (user_id,)
        )
        tumor_count = cursor.fetchone()[0]

        # No Tumor count
        no_tumor_count = total_predictions - tumor_count

        # Recent predictions (last 5)
        cursor.execute(
            'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            (user_id,)
        )
        recent_rows = cursor.fetchall()
        recent_predictions = []
        for row in recent_rows:
            recent_predictions.append({
                'id': row['id'],
                'image_path': row['image_path'],
                'predicted_class': row['predicted_class'],
                'probability': row['prediction_probability'],
                'prediction_probability': row['prediction_probability'],
                'processing_time': row['processing_time'],
                'grad_cam_path': row['grad_cam_path'],
                'created_at': row['created_at']
            })

        # Monthly data (last 6 months)
        cursor.execute(
            '''SELECT
                 strftime('%Y-%m', created_at) as month,
                 COUNT(*) as count,
                 SUM(CASE WHEN predicted_class = 'Tumor' THEN 1 ELSE 0 END) as tumor_count,
                 SUM(CASE WHEN predicted_class = 'No Tumor' THEN 1 ELSE 0 END) as no_tumor_count
               FROM predictions
               WHERE user_id = ?
                 AND created_at >= date('now', '-6 months')
               GROUP BY month
               ORDER BY month ASC''',
            (user_id,)
        )
        monthly_rows = cursor.fetchall()
        monthly_data = []
        for row in monthly_rows:
            monthly_data.append({
                'month': row['month'],
                'count': row['count'],
                'tumor_count': row['tumor_count'],
                'no_tumor_count': row['no_tumor_count']
            })

        return jsonify({
            'success': True,
            'data': {
                'total_predictions': total_predictions,
                'tumor_count': tumor_count,
                'no_tumor_count': no_tumor_count,
                'recent_predictions': recent_predictions,
                'monthly_data': monthly_data
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/analytics', methods=['GET'])
@token_required
def api_analytics(current_user):
    """Get analytics data for the current user, including data for CSV export."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        user_id = current_user['id']

        # Total predictions
        cursor.execute('SELECT COUNT(*) FROM predictions WHERE user_id = ?', (user_id,))
        total_predictions = cursor.fetchone()[0]

        # Tumor count
        cursor.execute(
            "SELECT COUNT(*) FROM predictions WHERE user_id = ? AND predicted_class = 'Tumor'",
            (user_id,)
        )
        tumor_count = cursor.fetchone()[0]

        no_tumor_count = total_predictions - tumor_count

        # Monthly data (last 6 months)
        cursor.execute(
            '''SELECT
                 strftime('%Y-%m', created_at) as month,
                 COUNT(*) as count,
                 SUM(CASE WHEN predicted_class = 'Tumor' THEN 1 ELSE 0 END) as tumor_count,
                 SUM(CASE WHEN predicted_class = 'No Tumor' THEN 1 ELSE 0 END) as no_tumor_count
               FROM predictions
               WHERE user_id = ?
                 AND created_at >= date('now', '-6 months')
               GROUP BY month
               ORDER BY month ASC''',
            (user_id,)
        )
        monthly_rows = cursor.fetchall()
        monthly_data = [
            {
                'month': row['month'],
                'count': row['count'],
                'tumor_count': row['tumor_count'],
                'no_tumor_count': row['no_tumor_count']
            }
            for row in monthly_rows
        ]

        # All predictions for CSV export
        cursor.execute(
            'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        )
        all_rows = cursor.fetchall()
        all_predictions = [
            {
                'id': row['id'],
                'image_path': row['image_path'],
                'predicted_class': row['predicted_class'],
                'probability': row['prediction_probability'],
                'prediction_probability': row['prediction_probability'],
                'processing_time': row['processing_time'],
                'grad_cam_path': row['grad_cam_path'],
                'created_at': row['created_at']
            }
            for row in all_rows
        ]

        return jsonify({
            'success': True,
            'data': {
                'total_predictions': total_predictions,
                'tumor_count': tumor_count,
                'no_tumor_count': no_tumor_count,
                'monthly_data': monthly_data,
                'all_predictions': all_predictions,
                'predictions': all_predictions,
                'history': all_predictions
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
    finally:
        conn.close()


# ─────────────────────────────────────────────
# Model Info & Health Routes
# ─────────────────────────────────────────────

@app.route('/api/model-info', methods=['GET'])
def api_model_info():
    """Return model status, architecture info, and evaluation metrics."""
    info = get_model_info()

    # Check for evaluation results
    eval_path = os.path.join(REPORTS_DIR, 'evaluation.json')
    if os.path.exists(eval_path):
        try:
            with open(eval_path, 'r') as f:
                info['evaluation'] = json.load(f)
        except (json.JSONDecodeError, IOError):
            info['evaluation'] = None

    # Check for training history
    history_path = os.path.join(REPORTS_DIR, 'training_history.json')
    if os.path.exists(history_path):
        try:
            with open(history_path, 'r') as f:
                info['training_history'] = json.load(f)
        except (json.JSONDecodeError, IOError):
            info['training_history'] = None

    return jsonify({'success': True, 'data': info}), 200


@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint."""
    model = get_model()
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    }), 200


# ─────────────────────────────────────────────
# Static File Serving
# ─────────────────────────────────────────────

@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded images."""
    return send_from_directory(os.path.abspath(UPLOAD_DIR), filename)


@app.route('/gradcam/<filename>')
def serve_gradcam(filename):
    """Serve Grad-CAM visualization images."""
    return send_from_directory(os.path.abspath(GRADCAM_DIR), filename)


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────

if __name__ == '__main__':
    # Initialize the database
    init_db()

    # Attempt to load the model at startup
    model = load_model()
    if model is not None:
        print("[App] Model loaded successfully at startup")
    else:
        print("[App] WARNING: Model not loaded. Predictions will fail until model is available.")
        print(f"[App] Expected model path: {os.path.abspath(os.path.join(BASE_DIR, '..', 'models', 'brain_tumor_cnn.keras'))}")

    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
