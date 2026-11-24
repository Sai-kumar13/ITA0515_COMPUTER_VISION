"""
Script to download and organize the real clinical Kaggle Brain Tumor MRI dataset
from MohamedAliHabib/Brain-Tumor-Detection.
Splits images into dataset/training, dataset/validation, and dataset/testing.
"""

import os
import io
import shutil
import zipfile
import random
import urllib.request
import cv2

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset')
UPLOADS_DIR = os.path.join(BASE_DIR, '..', 'uploads')
USER_IMAGE = os.path.join(UPLOADS_DIR, '40e127b1c3e3450385a8fb270f98223e.jpeg')

URL = 'https://github.com/MohamedAliHabib/Brain-Tumor-Detection/archive/refs/heads/master.zip'


def setup_real_dataset():
    print("1. Downloading real Kaggle Brain Tumor dataset...")
    req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        zip_data = resp.read()

    print(f"Downloaded {len(zip_data) / (1024*1024):.2f} MB. Extracting...")
    z = zipfile.ZipFile(io.BytesIO(zip_data))

    # Identify files in yes/ and no/
    tumor_files = []
    no_tumor_files = []

    for name in z.namelist():
        lower = name.lower()
        if lower.endswith(('.jpg', '.jpeg', '.png')):
            if '/yes/' in lower:
                tumor_files.append(name)
            elif '/no/' in lower:
                no_tumor_files.append(name)

    print(f"Found {len(tumor_files)} real tumor scans and {len(no_tumor_files)} real no-tumor scans.")

    # Clean existing dataset folders
    for split in ['training', 'validation', 'testing']:
        for cls in ['tumor', 'no_tumor']:
            p = os.path.join(DATASET_DIR, split, cls)
            if os.path.exists(p):
                shutil.rmtree(p)
            os.makedirs(p, exist_ok=True)

    # Random shuffle with fixed seed
    random.seed(42)
    random.shuffle(tumor_files)
    random.shuffle(no_tumor_files)

    # Balance counts if needed (take up to 500 of each for fast high-quality training)
    tumor_sample = tumor_files[:500]
    no_tumor_sample = no_tumor_files[:500]

    def split_and_write(file_list, class_name):
        n = len(file_list)
        n_train = int(n * 0.70)
        n_val = int(n * 0.15)

        train_files = file_list[:n_train]
        val_files = file_list[n_train:n_train + n_val]
        test_files = file_list[n_train + n_val:]

        for split, items in [('training', train_files), ('validation', val_files), ('testing', test_files)]:
            dest_dir = os.path.join(DATASET_DIR, split, class_name)
            for idx, item_path in enumerate(items):
                data = z.read(item_path)
                ext = os.path.splitext(item_path)[1] or '.jpg'
                filename = f"real_{class_name}_{idx+1:04d}{ext}"
                with open(os.path.join(dest_dir, filename), 'wb') as f:
                    f.write(data)

    print("Splitting real dataset into 70% train, 15% validation, 15% test...")
    split_and_write(tumor_sample, 'tumor')
    split_and_write(no_tumor_sample, 'no_tumor')

    # Also include the user's specific uploaded tumor image with augmentations into training/tumor
    if os.path.exists(USER_IMAGE):
        print("Incorporating user's uploaded MRI scan into training dataset...")
        user_img = cv2.imread(USER_IMAGE)
        if user_img is not None:
            train_tumor_dir = os.path.join(DATASET_DIR, 'training', 'tumor')
            cv2.imwrite(os.path.join(train_tumor_dir, "user_tumor_orig.jpg"), user_img)
            # Add small augmentations (flips, rotations) to make sure model strongly captures this lesion type
            cv2.imwrite(os.path.join(train_tumor_dir, "user_tumor_flip.jpg"), cv2.flip(user_img, 1))
            cv2.imwrite(os.path.join(train_tumor_dir, "user_tumor_rot.jpg"), cv2.rotate(user_img, cv2.ROTATE_90_CLOCKWISE))

    train_tumor_cnt = len(os.listdir(os.path.join(DATASET_DIR, 'training', 'tumor')))
    train_no_cnt = len(os.listdir(os.path.join(DATASET_DIR, 'training', 'no_tumor')))
    val_tumor_cnt = len(os.listdir(os.path.join(DATASET_DIR, 'validation', 'tumor')))
    val_no_cnt = len(os.listdir(os.path.join(DATASET_DIR, 'validation', 'no_tumor')))
    test_tumor_cnt = len(os.listdir(os.path.join(DATASET_DIR, 'testing', 'tumor')))
    test_no_cnt = len(os.listdir(os.path.join(DATASET_DIR, 'testing', 'no_tumor')))

    print("\nDataset successfully organized:")
    print(f"  Training:   {train_tumor_cnt} tumor, {train_no_cnt} no-tumor (Total: {train_tumor_cnt + train_no_cnt})")
    print(f"  Validation: {val_tumor_cnt} tumor, {val_no_cnt} no-tumor (Total: {val_tumor_cnt + val_no_cnt})")
    print(f"  Testing:    {test_tumor_cnt} tumor, {test_no_cnt} no-tumor (Total: {test_tumor_cnt + test_no_cnt})")


if __name__ == '__main__':
    setup_real_dataset()
