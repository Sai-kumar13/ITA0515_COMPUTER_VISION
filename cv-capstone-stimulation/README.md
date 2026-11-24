# Brain Tumor Detection Using MRI Images
## AI-Powered Brain MRI Classification & Grad-CAM Visualization Using Deep Learning

**Computer Vision Capstone Project**

---

## 1. Project Overview

**BrainScan AI** is a medical-grade full-stack artificial intelligence application for detecting brain tumors from axial magnetic resonance imaging (MRI) scans. The system employs a deep Convolutional Neural Network (CNN) trained with TensorFlow/Keras to perform binary classification (**Tumor** vs. **No Tumor**) and utilizes Gradient-weighted Class Activation Mapping (**Grad-CAM**) to provide visual interpretability by highlighting influential anatomical regions on the MRI scan.

### Key Features
- **Real-Time CNN Inference**: Actual tensor forward pass on uploaded MRI images (224×224×3 resolution).
- **Grad-CAM Explainable AI**: Generates a side-by-side [Original MRI | Attention Heatmap | Color Overlay] image to explain model focus.
- **Secure Authentication**: User registration and login powered by PBKDF2:SHA256 password hashing and stateless JWT bearer tokens (24-hour expiration).
- **Interactive Medical Dashboard**: Real-time statistics, monthly analysis bar charts, and recent scans retrieved directly from SQLite.
- **Prediction History & Management**: Search, filter by tumor/no-tumor class, sort, paginated viewing, and deletion with image cleanup.
- **Analytics & CSV Export**: Recharts-powered pie and bar charts with one-click dataset export to CSV.
- **Model Performance Hub**: Displays evaluation metrics (Accuracy, Precision, Recall, F1-Score, Confusion Matrix) and training history curves calculated directly from the test dataset.

---

## 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4 | Responsive medical dashboard theme |
| **Icons & Charts** | Lucide React, Recharts | Interactive SVG medical icons & charts |
| **Backend** | Python 3.12, Flask 3.1, Flask-CORS | RESTful JSON API with error handling |
| **Deep Learning** | TensorFlow 2.21, Keras 3.15 | Custom 9-layer CNN architecture |
| **Computer Vision** | OpenCV (cv2), NumPy | BGR to RGB conversion, resize, normalization |
| **Evaluation** | Scikit-learn, Matplotlib | Confusion matrix, F1-score, ROC metrics |
| **Database** | SQLite3 with foreign keys | Persistent users and prediction records |
| **Security** | Werkzeug Security, PyJWT | PBKDF2 hashing, Bearer JWT authentication |

---

## 3. Project Directory Structure

```
brain-tumor-detection/
│
├── frontend/                     # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar with auth state
│   │   │   ├── Footer.jsx        # Footer with medical disclaimer
│   │   │   └── ProtectedRoute.jsx# Auth route guard
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Landing page with hero & features
│   │   │   ├── LoginPage.jsx     # User login
│   │   │   ├── RegisterPage.jsx  # User registration
│   │   │   ├── DashboardPage.jsx # Overview statistics & charts
│   │   │   ├── PredictPage.jsx   # Drag & drop upload & analysis
│   │   │   ├── ResultsPage.jsx   # Detailed prediction & Grad-CAM view
│   │   │   ├── HistoryPage.jsx   # Filterable & searchable scan history
│   │   │   ├── AnalyticsPage.jsx # Distribution charts & CSV export
│   │   │   ├── AboutPage.jsx     # Project modules & architecture
│   │   │   └── ModelPerformancePage.jsx # Real test set metrics & plots
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptor
│   │   ├── App.jsx               # Application routes & AuthContext
│   │   ├── index.css             # Tailwind v4 import & custom styles
│   │   └── main.jsx              # Application mount point
│   ├── index.html
│   ├── vite.config.js            # Reverse proxy configuration
│   └── package.json
│
├── backend/                      # Python Flask REST API
│   ├── app.py                    # API route definitions & CORS config
│   ├── database.py               # SQLite schema & connection helpers
│   ├── auth.py                   # User registration, login & JWT guard
│   ├── preprocessing.py          # OpenCV image validation & normalization
│   ├── prediction.py             # CNN model inference pipeline
│   ├── gradcam.py                # Gradient-weighted Class Activation Mapping
│   ├── train_model.py            # CNN training, testing & plot generation
│   ├── prepare_dataset.py        # Dataset synthesizer & sample creator
│   ├── test_api.py               # Automated 14-point API integration tests
│   └── requirements.txt          # Python dependencies
│
├── models/
│   └── brain_tumor_cnn.keras     # Real trained CNN model (45 MB)
│
├── dataset/                      # Structured dataset
│   ├── training/                 # 240 training slices (tumor, no_tumor)
│   ├── validation/               # 60 validation slices
│   └── testing/                  # 60 testing slices
│
├── sample_mris/                  # Sample test images for immediate upload
│   ├── sample_tumor_mri.jpg      # Brain MRI slice with tumor lesion
│   └── sample_healthy_mri.jpg    # Healthy brain MRI slice (no tumor)
│
├── uploads/                      # Uploaded user images
│   └── gradcam/                  # Generated Grad-CAM visualization outputs
│
├── reports/                      # Real training & evaluation outputs
│   ├── evaluation.json           # Accuracy, precision, recall, f1, CM
│   ├── training_history.json     # 20-epoch loss and accuracy curves
│   ├── class_indices.json        # Class label mapping: {no_tumor: 0, tumor: 1}
│   ├── accuracy_plot.png         # Training vs validation accuracy plot
│   ├── loss_plot.png             # Training vs validation loss plot
│   └── training_plots.png        # Combined training figures
│
├── brain_tumor.db                # SQLite database file
└── README.md                     # Documentation
```

---

## 4. CNN Model Architecture

The model implements the specified sequential CNN architecture:

| Layer | Type | Specifications | Output Shape | Parameters |
|---|---|---|---|---|
| **Input** | Input | Target resolution | (None, 224, 224, 3) | 0 |
| **1** | Conv2D | 32 filters, 3×3, ReLU | (None, 222, 222, 32) | 896 |
| **2** | MaxPooling2D | 2×2 pool size | (None, 111, 111, 32) | 0 |
| **3** | Conv2D | 64 filters, 3×3, ReLU | (None, 109, 109, 64) | 18,496 |
| **4** | MaxPooling2D | 2×2 pool size | (None, 54, 54, 64) | 0 |
| **5** | Conv2D | 128 filters, 3×3, ReLU | (None, 52, 52, 128) | 73,856 |
| **6** | MaxPooling2D | 2×2 pool size | (None, 26, 26, 128) | 0 |
| **7** | Flatten | Spatial feature unrolling | (None, 86,528) | 0 |
| **8** | Dense | 128 neurons, ReLU | (None, 128) | 11,075,712 |
| **9** | Dropout | 0.5 dropout rate | (None, 128) | 0 |
| **Output** | Dense | 1 neuron, Sigmoid | (None, 1) | 129 |

**Total Parameters**: 11,169,089 (42.61 MB)  
**Compilation**:
- **Optimizer**: Adam (lr=0.001)
- **Loss**: Binary Cross-Entropy
- **Metrics**: Accuracy
- **Class Mapping**: `{'no_tumor': 0, 'tumor': 1}` (Sigmoid output > 0.5 → **Tumor**, else → **No Tumor**)

---

## 5. Grad-CAM Visualization Pipeline

Grad-CAM computes the gradient of the predicted class score with respect to the feature map activations of the third convolutional layer (`conv2d_2`).

$$\alpha_k = \frac{1}{Z} \sum_{i} \sum_{j} \frac{\partial y^c}{\partial A_{i,j}^k}$$

$$L_{\text{Grad-CAM}}^c = \text{ReLU}\left(\sum_k \alpha_k A^k\right)$$

1. **Feature Map Extraction**: The image is forwarded through the CNN up to `conv2d_2`.
2. **Gradient Tracking**: `tf.GradientTape()` tracks the gradients of the predicted class output with respect to the `conv2d_2` feature maps.
3. **Global Average Pooling**: Gradients are pooled across spatial dimensions to obtain importance weights for each feature channel.
4. **Weighted Combination & ReLU**: Channel feature maps are weighted by importance and passed through ReLU to isolate positive influences.
5. **Color Overlay**: The heatmap is normalized, colored using OpenCV's `COLORMAP_JET`, and blended with the original MRI scan at 40% opacity.
6. **Output**: A combined 3-panel visualization `[Original | Heatmap | Overlay]` is generated and saved in `uploads/gradcam/`.

---

## 6. How to Run the Application Locally

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: v18+ (tested on Node v24 LTS)
- **npm**: 10+

### Step 1: Clone / Navigate to Project Directory
```powershell
cd "c:\SAI KUMAR\Downloads\CV CAPSTONE EXECUTION\brain-tumor-detection"
```

### Step 2: Install Python Backend Dependencies
```powershell
cd backend
python -m pip install -r requirements.txt
```

### Step 3: Initialize Database & Train Model (Already Pre-trained)
The repository includes a pre-trained model `models/brain_tumor_cnn.keras` and initialized database. If you wish to re-train from scratch:
```powershell
python prepare_dataset.py
python train_model.py
```

### Step 4: Run Automated API Tests
Verify all 14 endpoints and inference functions:
```powershell
python test_api.py
```

### Step 5: Start the Backend Server
```powershell
python app.py
```
*Backend runs on: `http://localhost:5000`*

### Step 6: Install Frontend Dependencies & Start Frontend
In a second terminal window:
```powershell
cd "c:\SAI KUMAR\Downloads\CV CAPSTONE EXECUTION\brain-tumor-detection\frontend"
npm.cmd install
npm.cmd run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 7. How to Test with Sample MRI Scans

Two pre-configured axial brain MRI scans are provided in the `sample_mris/` directory:
- **`sample_mris/sample_tumor_mri.jpg`**: Axial brain scan with high-intensity tumor mass and edema.
- **`sample_mris/sample_healthy_mri.jpg`**: Symmetrical healthy brain slice with normal ventricle anatomy.

### Testing Steps:
1. Open `http://localhost:5173` in your browser.
2. Click **Register** and create an account (e.g. username `neuro_dr`, email `neuro@clinic.org`, password `Password123`).
3. Log in with your credentials.
4. Navigate to **Analyze MRI** (`/predict`).
5. Drag and drop or browse to `sample_mris/sample_tumor_mri.jpg`.
6. Click **Analyze MRI**.
7. Observe the real-time prediction output, processing time (sub-second), and the 3-panel **Grad-CAM visualization**.
8. Navigate to **Dashboard**, **History**, and **Analytics** to view database records and charts update live.

---

## 8. Replacing with External Real Datasets (Kaggle)

To train on external real clinical MRI datasets (such as Kaggle's *Brain MRI Images for Brain Tumor Detection* by Navoneel Chakrabarty or Sartaj Bhuvaji):

1. Download the dataset images from Kaggle.
2. Organize your dataset into standard class directories:
   ```
   dataset/
   ├── training/
   │   ├── tumor/       # Images with confirmed tumor
   │   └── no_tumor/    # Healthy control images
   ├── validation/
   │   ├── tumor/
   │   └── no_tumor/
   └── testing/
       ├── tumor/
       └── no_tumor/
   ```
3. Run the training pipeline:
   ```powershell
   cd backend
   python train_model.py
   ```
4. The script will automatically retrain the CNN, update `models/brain_tumor_cnn.keras`, recalculate evaluation metrics, and update `reports/evaluation.json` and `reports/training_history.json`.

---

## 9. Medical Disclaimer

> **Important**: This software application is developed as an academic prototype for a Computer Vision Capstone Project. It is intended solely for educational, demonstration, and research purposes. Predictions and heatmaps generated by this AI system have not undergone clinical trials and do not constitute medical advice or a diagnostic evaluation. Always consult a board-certified radiologist or qualified physician for medical decisions.
