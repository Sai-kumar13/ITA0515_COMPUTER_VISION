"""
Dataset Preparation Script for Brain Tumor Detection.
Generates a structured dataset of synthetic axial brain MRI slices
(both Tumor and No Tumor classes) for model training, validation, and testing.
Also copies sample test images to sample_mris/ for easy user testing.
"""

import os
import random
import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset')
SAMPLE_DIR = os.path.join(BASE_DIR, '..', 'sample_mris')

os.makedirs(SAMPLE_DIR, exist_ok=True)


def generate_brain_slice(has_tumor=False, size=224, seed=None):
    """
    Generate a realistic synthetic axial T1/T2 brain MRI image.
    """
    if seed is not None:
        np.random.seed(seed)
        random.seed(seed)

    # Canvas (black background)
    img = np.zeros((size, size), dtype=np.float32)

    cx, cy = size // 2, size // 2
    rx = int(size * random.uniform(0.36, 0.40))
    ry = int(size * random.uniform(0.40, 0.44))

    # Create coordinate grid
    y, x = np.ogrid[:size, :size]

    # Skull mask
    skull_dist = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2)
    skull_mask = skull_dist <= 1.0

    # Scalp / skull thickness
    scalp_mask = (skull_dist <= 1.0) & (skull_dist > 0.94)
    bone_mask = (skull_dist <= 0.94) & (skull_dist > 0.88)
    dura_mask = (skull_dist <= 0.88) & (skull_dist > 0.85)

    img[scalp_mask] = random.uniform(0.25, 0.35)
    img[bone_mask] = random.uniform(0.05, 0.12)
    img[dura_mask] = random.uniform(0.20, 0.30)

    # Brain parenchyma mask
    brain_rx = int(rx * 0.85)
    brain_ry = int(ry * 0.85)
    brain_dist = ((x - cx) ** 2) / (brain_rx ** 2) + ((y - cy) ** 2) / (brain_ry ** 2)
    brain_mask = brain_dist <= 1.0

    # Base brain tissue intensity
    parenchyma = np.zeros((size, size), dtype=np.float32)
    # Perlin-like texture with Gaussian blur
    noise = np.random.normal(0.48, 0.08, (size, size)).astype(np.float32)
    noise = cv2.GaussianBlur(noise, (15, 15), 0)
    parenchyma[brain_mask] = noise[brain_mask]

    # Add bilateral ventricles (dark cavities)
    v_offset_x = int(size * 0.04)
    v_height = int(size * 0.10)
    v_width = int(size * 0.03)

    # Left & right ventricle ellipses
    v_left = ((x - (cx - v_offset_x)) ** 2) / (v_width ** 2) + ((y - cy) ** 2) / (v_height ** 2) <= 1.0
    v_right = ((x - (cx + v_offset_x)) ** 2) / (v_width ** 2) + ((y - cy) ** 2) / (v_height ** 2) <= 1.0
    parenchyma[v_left | v_right] = random.uniform(0.08, 0.15)

    # Longitudinal fissure (central line)
    fissure = (np.abs(x - cx) <= 1) & brain_mask
    parenchyma[fissure] = 0.12

    img[brain_mask] = parenchyma[brain_mask]

    if has_tumor:
        # Tumor location (in one of the hemispheres)
        side = random.choice([-1, 1])
        tumor_cx = cx + int(side * random.uniform(size * 0.12, size * 0.22))
        tumor_cy = cy + int(random.uniform(-size * 0.15, size * 0.15))
        tumor_rad = int(size * random.uniform(0.08, 0.14))

        # Tumor core
        t_dist = ((x - tumor_cx) ** 2) / ((tumor_rad * random.uniform(0.8, 1.2)) ** 2) + \
                 ((y - tumor_cy) ** 2) / ((tumor_rad * random.uniform(0.8, 1.2)) ** 2)
        tumor_core = t_dist <= 1.0

        # Edema region around tumor
        edema_mask = (t_dist <= 1.8) & brain_mask
        img[edema_mask] = np.clip(img[edema_mask] + 0.18, 0, 1.0)

        # High-intensity tumor core (heterogeneous brightness)
        core_noise = np.random.normal(0.88, 0.08, (size, size)).astype(np.float32)
        core_noise = cv2.GaussianBlur(core_noise, (7, 7), 0)
        img[tumor_core & brain_mask] = np.clip(core_noise[tumor_core & brain_mask], 0.70, 0.98)

    # Add mild scanner noise
    scanner_noise = np.random.normal(0, 0.02, (size, size)).astype(np.float32)
    img = np.clip(img + scanner_noise, 0.0, 1.0)

    # Convert to 8-bit grayscale
    img_uint8 = (img * 255).astype(np.uint8)

    # Convert to 3-channel RGB image (as expected by standard models)
    img_rgb = cv2.cvtColor(img_uint8, cv2.COLOR_GRAY2RGB)
    return img_rgb


def create_dataset():
    """Generate training, validation, and testing sets."""
    splits = {
        'training': {'tumor': 120, 'no_tumor': 120},
        'validation': {'tumor': 30, 'no_tumor': 30},
        'testing': {'tumor': 30, 'no_tumor': 30}
    }

    print("Generating synthetic brain MRI dataset...")
    total_count = 0

    for split_name, classes in splits.items():
        for class_name, count in classes.items():
            dir_path = os.path.join(DATASET_DIR, split_name, class_name)
            os.makedirs(dir_path, exist_ok=True)
            has_tumor = (class_name == 'tumor')

            for i in range(count):
                img = generate_brain_slice(has_tumor=has_tumor, size=224, seed=i * 1000 + (1 if has_tumor else 0))
                filename = f"{class_name}_{i+1:04d}.jpg"
                file_path = os.path.join(dir_path, filename)
                cv2.imwrite(file_path, img)
                total_count += 1

            print(f"  Created {count} {class_name} images in {split_name}/")

    # Generate sample MRI images for direct upload testing in sample_mris/
    print("\nGenerating sample test MRI images in sample_mris/ ...")
    sample_tumor = os.path.join(SAMPLE_DIR, 'sample_tumor_mri.jpg')
    sample_no_tumor = os.path.join(SAMPLE_DIR, 'sample_healthy_mri.jpg')

    img_tumor = generate_brain_slice(has_tumor=True, size=224, seed=42)
    img_no_tumor = generate_brain_slice(has_tumor=False, size=224, seed=99)

    cv2.imwrite(sample_tumor, img_tumor)
    cv2.imwrite(sample_no_tumor, img_no_tumor)
    print(f"  Saved sample tumor image: {sample_tumor}")
    print(f"  Saved sample healthy image: {sample_no_tumor}")

    print(f"\nDataset generation complete! Total images created: {total_count}")


if __name__ == '__main__':
    create_dataset()
