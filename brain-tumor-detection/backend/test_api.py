"""
Comprehensive Integration Test for Brain Tumor Detection API.
Tests all endpoints using Flask's test client.
"""

import io
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from app import app
from database import init_db


def run_tests():
    print("=" * 60)
    print("  Brain Tumor Detection — API Integration Tests")
    print("=" * 60)

    # Initialize DB
    init_db()

    client = app.test_client()

    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    data = json.loads(res.data)
    print(f"[PASS] GET /api/health -> status: {data['status']}, model_loaded: {data['model_loaded']}")

    # 2. Model info
    res = client.get('/api/model-info')
    assert res.status_code == 200, f"Model info failed: {res.data}"
    data = json.loads(res.data)
    info = data['data']
    print(f"[PASS] GET /api/model-info -> model_loaded: {info['model_loaded']}, total_params: {info.get('total_params')}")
    if 'evaluation' in info and info['evaluation']:
        print(f"       Evaluation accuracy: {info['evaluation'].get('accuracy'):.4f}, f1: {info['evaluation'].get('f1_score'):.4f}")

    # 3. User Registration
    test_user = {
        'username': 'doctor_smith',
        'email': 'smith@hospital.org',
        'password': 'SecurePassword123'
    }
    res = client.post('/api/register', json=test_user)
    assert res.status_code in (201, 400), f"Registration failed: {res.data}"
    print(f"[PASS] POST /api/register -> status code {res.status_code}")

    # 4. User Login
    res = client.post('/api/login', json={'username': test_user['username'], 'password': test_user['password']})
    assert res.status_code == 200, f"Login failed: {res.data}"
    data = json.loads(res.data)
    token = data['data']['token']
    user = data['data']['user']
    print(f"[PASS] POST /api/login -> Logged in as '{user['username']}', JWT token received")

    auth_headers = {'Authorization': f'Bearer {token}'}

    # 5. Predict with sample tumor MRI
    sample_path = os.path.join(BASE_DIR, '..', 'sample_mris', 'sample_tumor_mri.jpg')
    with open(sample_path, 'rb') as f:
        img_bytes = f.read()

    res = client.post(
        '/api/predict',
        headers=auth_headers,
        data={'file': (io.BytesIO(img_bytes), 'sample_mri.jpg')},
        content_type='multipart/form-data'
    )
    assert res.status_code == 200, f"Prediction failed: {res.data}"
    data = json.loads(res.data)['data']
    pred_id = data['id']
    print(f"[PASS] POST /api/predict -> Predicted: {data['predicted_class']}, Probability: {data['probability']}, Time: {data['processing_time']}s, Grad-CAM: {data['grad_cam_path']}")

    # 6. Predict with sample healthy MRI
    sample_healthy = os.path.join(BASE_DIR, '..', 'sample_mris', 'sample_healthy_mri.jpg')
    with open(sample_healthy, 'rb') as f:
        h_bytes = f.read()

    res2 = client.post(
        '/api/predict',
        headers=auth_headers,
        data={'file': (io.BytesIO(h_bytes), 'sample_healthy.jpg')},
        content_type='multipart/form-data'
    )
    assert res2.status_code == 200, f"Healthy prediction failed: {res2.data}"
    data2 = json.loads(res2.data)['data']
    print(f"[PASS] POST /api/predict -> Predicted: {data2['predicted_class']}, Probability: {data2['probability']}, Time: {data2['processing_time']}s")

    # 7. Dashboard
    res = client.get('/api/dashboard', headers=auth_headers)
    assert res.status_code == 200, f"Dashboard failed: {res.data}"
    dash_data = json.loads(res.data)['data']
    print(f"[PASS] GET /api/dashboard -> Total: {dash_data['total_predictions']}, Tumor: {dash_data['tumor_count']}, No Tumor: {dash_data['no_tumor_count']}")

    # 8. History
    res = client.get('/api/history', headers=auth_headers)
    assert res.status_code == 200, f"History failed: {res.data}"
    hist_data = json.loads(res.data)['data']
    print(f"[PASS] GET /api/history -> Found {len(hist_data['predictions'])} history records (Total: {hist_data['total']})")

    # 9. History Detail
    res = client.get(f'/api/history/{pred_id}', headers=auth_headers)
    assert res.status_code == 200, f"History item failed: {res.data}"
    item = json.loads(res.data)['data']
    print(f"[PASS] GET /api/history/{pred_id} -> Item class: {item['predicted_class']}, probability: {item['probability']}")

    # 10. Analytics
    res = client.get('/api/analytics', headers=auth_headers)
    assert res.status_code == 200, f"Analytics failed: {res.data}"
    analytics_data = json.loads(res.data)['data']
    print(f"[PASS] GET /api/analytics -> Analyzed: {analytics_data['total_predictions']}")

    # 11. Serve uploaded image
    res = client.get(f"/uploads/{data['image_path']}")
    assert res.status_code == 200, f"Upload image serving failed: {res.status_code}"
    print(f"[PASS] GET /uploads/{data['image_path']} -> Size: {len(res.data)} bytes")

    # 12. Serve Grad-CAM image
    if data['grad_cam_path']:
        res = client.get(f"/gradcam/{data['grad_cam_path']}")
        assert res.status_code == 200, f"Grad-CAM image serving failed: {res.status_code}"
        print(f"[PASS] GET /gradcam/{data['grad_cam_path']} -> Size: {len(res.data)} bytes")

    # 13. Delete history item
    res = client.delete(f'/api/history/{pred_id}', headers=auth_headers)
    assert res.status_code == 200, f"Delete failed: {res.data}"
    print(f"[PASS] DELETE /api/history/{pred_id} -> Deleted successfully")

    # 14. Logout
    res = client.post('/api/logout')
    assert res.status_code == 200, f"Logout failed: {res.data}"
    print("[PASS] POST /api/logout -> Logged out")

    print("\n" + "=" * 60)
    print("  ALL 14 API INTEGRATION TESTS PASSED SUCCESSFULLY! ")
    print("=" * 60)


if __name__ == '__main__':
    run_tests()
