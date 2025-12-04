# Model Documentation

This folder contains AI/ML model implementations for the Pariksha Guardian Nexus proctoring system. The models work together to detect and analyze student behavior during online examinations.

## Overview

The system implements a multi-model architecture for real-time exam proctoring with the following capabilities:
- Face detection and tracking
- Facial landmark detection (68 points)
- Head pose estimation and gaze direction analysis
- Multiple person detection
- Real-time behavior classification

## Architecture & Algorithms

### 1. Face Detection (`FaceDetector` class)
**Algorithm**: Single Shot MultiBox Detector (SSD) with ResNet-10 backbone

**Model Details**:
- Framework: OpenCV DNN module with Caffe models
- Input: 300×300 RGB images
- Model: `res10_300x300_ssd_iter_140000.caffemodel`
- Configuration: `deploy.prototxt`
- Output: Bounding boxes with confidence scores

**Process**:
1. Converts input image to blob (300×300, mean subtraction: [104.0, 177.0, 123.0])
2. Runs forward pass through the SSD network
3. Filters detections by confidence threshold (default: 0.5)
4. Returns face bounding boxes and confidence scores

### 2. Facial Landmark Detection (`MarkDetector` class)
**Algorithm**: Convolutional Neural Network (CNN) for facial landmark regression

**Model Details**:
- Framework: TensorFlow/Keras
- Model path: `assets/pose_model`
- Input: 128×128 RGB face images
- Output: 68 facial landmark coordinates (x, y)

**Key Features**:
- Detects 68 facial landmarks including eyes, nose, mouth, and jaw contours
- Uses face detection as preprocessing step
- Applies geometric transformations for robust detection:
  - Box offset adjustment (12% downward movement)
  - Square box expansion for consistent input
  - Boundary validation

**Process**:
1. Extracts face region using `FaceDetector`
2. Applies box adjustments and square transformation
3. Resizes face to 128×128 pixels
4. Runs CNN inference to predict 68 (x, y) landmark coordinates
5. Transforms coordinates back to original image space

### 3. Head Pose Estimation (`PoseEstimator` class)
**Algorithm**: Perspective-n-Point (PnP) algorithm with 3D-2D correspondence

**Model Details**:
- Method: `cv2.solvePnP` with iterative refinement
- 3D Model: 68-point facial model loaded from `assets/model.txt`
- Camera Model: Pinhole camera with focal length calibration

**Process**:
1. Uses 68 2D facial landmarks from `MarkDetector`
2. Matches with corresponding 3D model points
3. Solves PnP problem to estimate rotation and translation vectors
4. Calculates Euler angles (pitch, yaw, roll) using Rodrigues transformation
5. Applies `cv2.RQDecomp3x3` for rotation matrix decomposition

**Pose Classification Thresholds**:
- **Pitch** (up/down):
  - Looking up: < -15°
  - Looking down: > 15°
- **Yaw** (left/right):
  - Looking left: < -20°
  - Looking right: > 20°
- **Looking straight**: |pitch| < 10° AND |yaw| < 10°

**Rotation Vectors**:
- Rotation vector: 3×1 matrix in axis-angle representation
- Translation vector: 3×1 matrix for camera position
- Uses previous frame estimation as initial guess for stability

### 4. Multiple Person Detection
**Algorithm**: EfficientDet D0

**Model Details**:
- Framework: TensorFlow Hub
- Model: `tensorflow/efficientdet/d0/1`
- Object Detection: COCO dataset trained (80 classes)
- Person class ID: 1

**Process**:
1. Loads pre-trained EfficientDet D0 model from TensorFlow Hub
2. Performs object detection on full image
3. Filters detections for "person" class (ID = 1)
4. Applies confidence threshold (0.5)
5. Counts number of detected persons

## Structure

```
model/
├── assets/              # Model files and configurations
│   ├── deploy.prototxt  # SSD face detector configuration
│   ├── res10_300x300_ssd_iter_140000.caffemodel  # SSD weights
│   ├── pose_model/      # CNN landmark detection model
│   └── model.txt        # 68-point 3D facial model coordinates
├── images/              # Documentation and visualization images
├── mark_detector.py     # Face and landmark detection implementation
├── pose_estimator.py    # Head pose estimation implementation
└── app.py              # Flask API server
```

## API Endpoints

### Flask Application (`app.py`)

#### 1. `/predict_pose` (POST)
**Purpose**: Basic head pose detection and classification

**Input**: JSON with base64 encoded image
```json
{
  "img": "data:image/jpeg;base64,..."
}
```

**Output**:
```json
{
  "message": "face found",
  "pose": {
    "rotation_vector": [...],
    "translation_vector": [...]
  },
  "head_pose": {
    "looking_up": false,
    "looking_down": false,
    "looking_left": false,
    "looking_right": false,
    "looking_straight": true,
    "pitch": -5.2,
    "yaw": 3.1,
    "roll": 1.8
  },
  "warnings": []
}
```

#### 2. `/predict_pose_detailed` (POST)
**Purpose**: Enhanced pose detection with annotated image output

**Additional Features**:
- Visual annotations on detected face
- Facial landmarks overlay
- Pose angle text overlay
- Warning indicators
- Returns annotated image as base64

#### 3. `/predict_people` (POST)
**Purpose**: Multiple person detection

**Output**:
```json
{
  "people": 2,
  "image": "image"
}
```

#### 4. `/save_img` (POST)
**Purpose**: Save captured images for audit

#### 5. `/health` (GET)
**Purpose**: System health check

## Dependencies

### Core Libraries
- **TensorFlow**: Deep learning framework for CNN models
- **TensorFlow Hub**: Pre-trained model loading (EfficientDet)
- **OpenCV (cv2)**: Computer vision operations, DNN module, PnP solver
- **NumPy**: Numerical computations and array operations
- **Flask**: REST API server
- **Matplotlib**: Image visualization and saving

### Model Files Required
1. `deploy.prototxt` - SSD face detector architecture
2. `res10_300x300_ssd_iter_140000.caffemodel` - SSD weights
3. `assets/pose_model/` - Keras landmark detection model
4. `assets/model.txt` - 3D facial landmark coordinates

## Usage

### Initialize Models
```python
from mark_detector import MarkDetector, FaceDetector
from pose_estimator import PoseEstimator

# Initialize detectors
mark_detector = MarkDetector()
pose_estimator = PoseEstimator(img_size=(height, width))

# Detect face
facebox = mark_detector.extract_cnn_facebox(image)

# Detect landmarks
marks = mark_detector.detect_marks(face_image)

# Estimate pose
rotation_vector, translation_vector = pose_estimator.solve_pose_by_68_points(marks)
```

### Run Flask Server
```bash
python app.py
# Server runs on http://0.0.0.0:8080
```

## Algorithm Performance Characteristics

### Face Detection
- **Speed**: Real-time capable (~30-50ms per frame)
- **Accuracy**: High precision with 0.9 confidence threshold
- **Limitations**: May struggle with extreme lighting, occlusions, or side profiles

### Landmark Detection
- **Speed**: Fast inference (~10-20ms on CPU)
- **Accuracy**: Sub-pixel precision for frontal faces
- **Robustness**: Requires good face detection as preprocessing

### Pose Estimation
- **Speed**: Near real-time (~5-10ms)
- **Accuracy**: ±5-10° typical error for pitch/yaw
- **Stability**: Uses temporal smoothing with previous frame initialization

### Person Detection
- **Speed**: Moderate (~100-200ms per frame)
- **Accuracy**: COCO dataset performance (mAP ~34%)
- **Use Case**: Detecting multiple people in frame

## Proctoring Logic

The system flags suspicious behavior when:
1. **No face detected**: Student may have left seat
2. **Looking up**: Potential ceiling reference material
3. **Looking down**: Possible notes or phone
4. **Looking left/right**: Potential unauthorized collaboration or reference
5. **Multiple people**: Unauthorized assistance detected

## Future Enhancements

- Add eye gaze tracking for more precise attention monitoring
- Implement audio analysis for suspicious sounds
- Add object detection for phones, books, or unauthorized materials
- Implement temporal behavior pattern analysis
- Add emotion recognition for stress detection
