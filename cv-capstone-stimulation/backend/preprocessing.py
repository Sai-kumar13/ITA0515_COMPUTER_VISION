"""
Image preprocessing module for Brain Tumor Detection application.
Handles image validation and preprocessing for the CNN model.
"""

import os

import cv2
import numpy as np

# Allowed image extensions
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Target image dimensions
TARGET_SIZE = (224, 224)


def validate_image(file):
    """
    Validate an uploaded image file.

    Args:
        file: FileStorage object from Flask request

    Returns:
        dict: {valid: True} or {valid: False, error: message}
    """
    if file is None or file.filename == '':
        return {'valid': False, 'error': 'No file selected'}

    # Check file extension
    filename = file.filename.lower()
    extension = filename.rsplit('.', 1)[-1] if '.' in filename else ''

    if extension not in ALLOWED_EXTENSIONS:
        return {
            'valid': False,
            'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer

    if file_size > MAX_FILE_SIZE:
        return {
            'valid': False,
            'error': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB'
        }

    if file_size == 0:
        return {'valid': False, 'error': 'File is empty'}

    return {'valid': True}


def preprocess_image(image_path):
    """
    Preprocess an image for the CNN model.

    Args:
        image_path: Path to the image file

    Returns:
        numpy array: Preprocessed image of shape (1, 224, 224, 3) with values in [0, 1]

    Raises:
        FileNotFoundError: If image file does not exist
        ValueError: If image cannot be read or processed
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Read image with OpenCV
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Could not read image: {image_path}")

    # Convert BGR to RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Resize to 224x224
    image = cv2.resize(image, TARGET_SIZE)

    # Normalize pixel values to [0, 1]
    image = image.astype(np.float32) / 255.0

    # Expand dimensions to (1, 224, 224, 3) for batch processing
    image = np.expand_dims(image, axis=0)

    return image
