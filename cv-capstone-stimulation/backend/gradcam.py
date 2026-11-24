"""
Grad-CAM visualization module for Brain Tumor Detection application.
Generates Gradient-weighted Class Activation Mapping visualizations
to explain CNN predictions.
"""

import os
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('KERAS_HOME', os.path.join(BASE_DIR, '..', '.keras'))
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

import cv2
import numpy as np


# Default last convolutional layer name (third Conv2D layer)
DEFAULT_LAST_CONV_LAYER = 'conv2d_2'

# Grad-CAM output directory
GRADCAM_DIR = os.path.join(BASE_DIR, '..', 'uploads', 'gradcam')


def generate_gradcam(model, image_path, last_conv_layer_name=None):
    """
    Generate a Grad-CAM visualization for a given image and model.

    Args:
        model: Loaded Keras model
        image_path: Path to the input image
        last_conv_layer_name: Name of the last convolutional layer to use.
                              Defaults to 'conv2d_2'.

    Returns:
        str: Path to the saved Grad-CAM visualization image, or None if failed.
    """
    if model is None:
        print("[Grad-CAM] No model provided")
        return None

    if last_conv_layer_name is None:
        last_conv_layer_name = DEFAULT_LAST_CONV_LAYER

    try:
        import tensorflow as tf

        # Ensure output directory exists
        os.makedirs(GRADCAM_DIR, exist_ok=True)

        # Load and preprocess the image
        original_image = cv2.imread(image_path)
        if original_image is None:
            print(f"[Grad-CAM] Could not read image: {image_path}")
            return None

        # Resize original for display
        original_resized = cv2.resize(original_image, (224, 224))

        # Preprocess for model
        image_rgb = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
        image_resized = cv2.resize(image_rgb, (224, 224))
        image_array = image_resized.astype(np.float32) / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        # Find the conv layer index
        conv_idx = None
        for i, layer in enumerate(model.layers):
            if layer.name == last_conv_layer_name:
                conv_idx = i
                break

        if conv_idx is None:
            for i in range(len(model.layers) - 1, -1, -1):
                if 'conv' in model.layers[i].name.lower():
                    conv_idx = i
                    last_conv_layer_name = model.layers[i].name
                    break

        if conv_idx is None:
            print("[Grad-CAM] No convolutional layers found in model")
            return None

        # Convert image to tf.Tensor
        tensor_in = tf.convert_to_tensor(image_array, dtype=tf.float32)

        # Forward pass tracking gradients of conv layer output
        with tf.GradientTape() as tape:
            val = tensor_in
            for layer in model.layers[:conv_idx + 1]:
                val = layer(val)
            conv_outputs = val
            tape.watch(conv_outputs)

            out = conv_outputs
            for layer in model.layers[conv_idx + 1:]:
                out = layer(out)
            predicted_class = out[0][0]

        # Get gradients of the predicted class with respect to the feature maps
        grads = tape.gradient(predicted_class, conv_outputs)

        if grads is None:
            print("[Grad-CAM] Gradients are None — model may not be differentiable at this layer")
            return None

        # Global average pooling of gradients
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight the feature maps by the pooled gradients
        conv_outputs = conv_outputs[0]
        heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)

        # Apply ReLU and normalize
        heatmap = tf.maximum(heatmap, 0)
        max_val = tf.reduce_max(heatmap)
        if max_val > 0:
            heatmap = heatmap / max_val
        heatmap = heatmap.numpy()

        # Resize heatmap to match image dimensions
        heatmap_resized = cv2.resize(heatmap, (224, 224))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply colormap
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Create overlay
        overlay = cv2.addWeighted(original_resized, 0.6, heatmap_colored, 0.4, 0)

        # Create combined image: [Original | Heatmap | Overlay]
        combined = np.hstack([original_resized, heatmap_colored, overlay])

        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        label_height = 30
        labeled = np.zeros((224 + label_height, 224 * 3, 3), dtype=np.uint8)
        labeled[label_height:, :, :] = combined

        cv2.putText(labeled, 'Original', (70, 20), font, 0.6, (255, 255, 255), 1)
        cv2.putText(labeled, 'Heatmap', (224 + 70, 20), font, 0.6, (255, 255, 255), 1)
        cv2.putText(labeled, 'Overlay', (448 + 70, 20), font, 0.6, (255, 255, 255), 1)

        # Save the visualization
        filename = f"gradcam_{uuid.uuid4().hex[:12]}.png"
        output_path = os.path.join(GRADCAM_DIR, filename)
        cv2.imwrite(output_path, labeled)

        print(f"[Grad-CAM] Visualization saved to: {output_path}")
        return filename

    except Exception as e:
        print(f"[Grad-CAM] Error generating Grad-CAM: {e}")
        import traceback
        traceback.print_exc()
        return None
