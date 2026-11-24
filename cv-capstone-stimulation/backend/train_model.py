"""
CNN Model Training Script for Brain Tumor Detection.
Builds, trains, and evaluates a Convolutional Neural Network
for binary classification of brain MRI images (Tumor vs No Tumor).
"""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('KERAS_HOME', os.path.join(BASE_DIR, '..', '.keras'))
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt


def main():
    """Main training function."""
    # Lazy imports so the script can be loaded without TF installed
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input
    )
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
    )

    # ── Paths ──────────────────────────────────────────
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset')
    TRAIN_DIR = os.path.join(DATASET_DIR, 'training')
    VAL_DIR = os.path.join(DATASET_DIR, 'validation')
    TEST_DIR = os.path.join(DATASET_DIR, 'testing')
    MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
    REPORTS_DIR = os.path.join(BASE_DIR, '..', 'reports')

    MODEL_PATH = os.path.join(MODELS_DIR, 'brain_tumor_cnn.keras')

    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # Verify dataset directories exist
    for dir_path, label in [(TRAIN_DIR, 'Training'), (VAL_DIR, 'Validation'), (TEST_DIR, 'Testing')]:
        if not os.path.exists(dir_path):
            print(f"ERROR: {label} directory not found: {os.path.abspath(dir_path)}")
            sys.exit(1)

    # ── Hyperparameters ────────────────────────────────
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    EPOCHS = 12

    # ── Data Generators ────────────────────────────────
    print("\n" + "=" * 60)
    print("  Brain Tumor Detection — CNN Training")
    print("=" * 60)

    # Training data generator with augmentation
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )

    # Validation and test data generators (only rescaling)
    val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    print(f"\nLoading training data from: {os.path.abspath(TRAIN_DIR)}")
    train_generator = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=True
    )

    print(f"Loading validation data from: {os.path.abspath(VAL_DIR)}")
    val_generator = val_test_datagen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=False
    )

    print(f"Loading testing data from: {os.path.abspath(TEST_DIR)}")
    test_generator = val_test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=False
    )

    # Print and save class indices
    print(f"\nClass indices: {train_generator.class_indices}")
    class_indices_path = os.path.join(REPORTS_DIR, 'class_indices.json')
    with open(class_indices_path, 'w') as f:
        json.dump(train_generator.class_indices, f, indent=2)
    print(f"Class indices saved to: {class_indices_path}")

    # ── Build CNN Model ────────────────────────────────
    print("\n" + "-" * 60)
    print("  Building CNN Model")
    print("-" * 60)

    model = Sequential([
        Input(shape=(224, 224, 3)),

        # Block 1
        Conv2D(32, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),

        # Block 2
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),

        # Block 3
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),

        # Classifier
        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.5),
        Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    model.summary()

    # ── Train the Model ────────────────────────────────
    print("\n" + "-" * 60)
    print("  Training")
    print("-" * 60)

    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator,
        verbose=1
    )

    # Save the model
    model.save(MODEL_PATH)
    print(f"\nModel saved to: {os.path.abspath(MODEL_PATH)}")

    # ── Save Training History ──────────────────────────
    history_dict = {
        'accuracy': [float(v) for v in history.history['accuracy']],
        'val_accuracy': [float(v) for v in history.history['val_accuracy']],
        'loss': [float(v) for v in history.history['loss']],
        'val_loss': [float(v) for v in history.history['val_loss']],
        'epochs': EPOCHS
    }
    history_path = os.path.join(REPORTS_DIR, 'training_history.json')
    with open(history_path, 'w') as f:
        json.dump(history_dict, f, indent=2)
    print(f"Training history saved to: {history_path}")

    # ── Evaluate on Test Set ───────────────────────────
    print("\n" + "-" * 60)
    print("  Evaluation on Test Set")
    print("-" * 60)

    test_generator.reset()
    test_loss, test_accuracy = model.evaluate(test_generator, verbose=1)

    # Get predictions for metrics
    test_generator.reset()
    y_pred_probs = model.predict(test_generator, verbose=0)
    y_pred = (y_pred_probs > 0.5).astype(int).flatten()
    y_true = test_generator.classes

    # Compute metrics
    accuracy = float(accuracy_score(y_true, y_pred))
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()

    evaluation = {
        'test_loss': float(test_loss),
        'test_accuracy': float(test_accuracy),
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'confusion_matrix': cm,
        'class_indices': train_generator.class_indices
    }

    eval_path = os.path.join(REPORTS_DIR, 'evaluation.json')
    with open(eval_path, 'w') as f:
        json.dump(evaluation, f, indent=2)
    print(f"Evaluation metrics saved to: {eval_path}")

    # ── Print Summary ──────────────────────────────────
    print("\n" + "=" * 60)
    print("  Training Summary")
    print("=" * 60)
    print(f"  Test Loss:      {test_loss:.4f}")
    print(f"  Test Accuracy:  {test_accuracy:.4f}")
    print(f"  Precision:      {precision:.4f}")
    print(f"  Recall:         {recall:.4f}")
    print(f"  F1 Score:       {f1:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"    {cm}")
    print("=" * 60)

    # ── Save Plots ─────────────────────────────────────
    # Accuracy plot
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)

    # Loss plot
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)

    plt.tight_layout()
    plot_path = os.path.join(REPORTS_DIR, 'training_plots.png')
    plt.savefig(plot_path, dpi=150)
    plt.close()
    print(f"\nTraining plots saved to: {plot_path}")

    # Individual plots
    # Accuracy only
    plt.figure(figsize=(8, 5))
    plt.plot(history.history['accuracy'], label='Training Accuracy', marker='o')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy', marker='s')
    plt.title('Training vs Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'accuracy_plot.png'), dpi=150)
    plt.close()

    # Loss only
    plt.figure(figsize=(8, 5))
    plt.plot(history.history['loss'], label='Training Loss', marker='o')
    plt.plot(history.history['val_loss'], label='Validation Loss', marker='s')
    plt.title('Training vs Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'loss_plot.png'), dpi=150)
    plt.close()

    print("Individual plots saved to reports/")
    print("\nTraining complete!")


if __name__ == '__main__':
    main()
