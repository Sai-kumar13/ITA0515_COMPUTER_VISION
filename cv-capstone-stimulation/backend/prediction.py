"""
Prediction module for Brain Tumor Detection application.
Loads the CNN model and runs predictions on brain MRI images.
"""

import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('KERAS_HOME', os.path.join(BASE_DIR, '..', '.keras'))
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

import numpy as np

from preprocessing import preprocess_image

# Path to the trained model
MODEL_PATH = os.path.join(BASE_DIR, '..', 'models', 'brain_tumor_cnn.keras')

# Global model variable
_model = None


def load_model():
    """
    Load the TensorFlow/Keras model from disk.

    Returns:
        The loaded Keras model, or None if the model file is missing.
    """
    global _model

    if _model is not None:
        return _model

    model_path = os.path.abspath(MODEL_PATH)

    if not os.path.exists(model_path):
        print(f"[Prediction] Model file not found at: {model_path}")
        return None

    try:
        import tensorflow as tf
        _model = tf.keras.models.load_model(model_path)
        print(f"[Prediction] Model loaded successfully from: {model_path}")
        return _model
    except Exception as e:
        print(f"[Prediction] Error loading model: {e}")
        return None


def predict(image_path):
    """
    Run prediction on a brain MRI image.

    Args:
        image_path: Path to the image file

    Returns:
        dict: {
            success: True,
            predicted_class: str,
            probability: float,
            processing_time: float
        }
        or {success: False, error: str} if prediction fails
    """
    model = load_model()

    if model is None:
        return {
            'success': False,
            'error': 'Model not loaded. Please ensure the model file exists at: '
                     + os.path.abspath(MODEL_PATH)
        }

    try:
        start_time = time.time()

        # Preprocess the image
        processed_image = preprocess_image(image_path)

        # Run prediction
        prediction = model.predict(processed_image, verbose=0)

        # Get prediction probability (sigmoid output)
        probability = float(prediction[0][0])

        # Map to class: probability > 0.5 => "Tumor", else => "No Tumor"
        predicted_class = "Tumor" if probability > 0.5 else "No Tumor"

        processing_time = round(time.time() - start_time, 3)

        return {
            'success': True,
            'predicted_class': predicted_class,
            'probability': round(probability, 4),
            'processing_time': processing_time
        }

    except FileNotFoundError as e:
        return {'success': False, 'error': str(e)}
    except ValueError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': f'Prediction failed: {str(e)}'}


def get_model():
    """Return the currently loaded model (or None)."""
    global _model
    if _model is None:
        return load_model()
    return _model


def get_model_info():
    """
    Get information about the loaded model.

    Returns:
        dict with model status and architecture info
    """
    model = load_model()

    info = {
        'model_loaded': model is not None,
        'model_path': os.path.abspath(MODEL_PATH),
        'expected_input_shape': [None, 224, 224, 3]
    }

    if model is not None:
        try:
            info['total_params'] = int(model.count_params())
            info['input_shape'] = str(model.input_shape)
            info['output_shape'] = str(model.output_shape)

            layers = []
            for layer in model.layers:
                layers.append({
                    'name': layer.name,
                    'type': layer.__class__.__name__,
                    'output_shape': str(layer.output_shape)
                })
            info['layers'] = layers
        except Exception as e:
            info['architecture_error'] = str(e)

    return info
