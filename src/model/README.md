<div align="center">

# 🎓 Pariksha Guardian Nexus - AI Cheating Detection

### *Real-time Exam Proctoring with YOLO-based Computer Vision*

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-orange.svg)](https://ultralytics.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green.svg)](https://opencv.org/)
[![Flask](https://img.shields.io/badge/Flask-2.x-black.svg)](https://flask.palletsprojects.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [API Endpoints](#-api-endpoints)
- [Usage Examples](#-usage-examples)
- [Custom Model Training](#-custom-model-training)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

The **Pariksha Guardian Nexus AI Module** implements a comprehensive **YOLO-based cheating detection system** for real-time exam proctoring. It combines state-of-the-art object detection with head pose estimation to ensure academic integrity.

### ✨ Core Capabilities

| Feature | Description |
|---------|-------------|
| 📱 **Object Detection** | Detects phones, books, laptops, and other cheating materials using YOLOv8 |
| 👥 **Person Detection** | Counts people in frame, detects unauthorized persons |
| 🧭 **Head Pose Estimation** | Tracks where the student is looking (up, down, left, right) |
| ⚡ **Real-time Analysis** | Process frames in milliseconds for instant feedback |
| 🎯 **Severity Classification** | Categorizes incidents by severity level (critical, high, medium, low) |

---

## 🚀 Features

### Cheating Detection Types

```python
class CheatingType:
    PHONE_DETECTED = "phone_detected"
    BOOK_DETECTED = "book_detected"
    PAPER_DETECTED = "paper_detected"
    EARPHONE_DETECTED = "earphone_detected"
    MULTIPLE_PERSONS = "multiple_persons"
    NO_PERSON = "no_person"
    LOOKING_UP = "looking_up"
    LOOKING_DOWN = "looking_down"
    LOOKING_LEFT = "looking_left"
    LOOKING_RIGHT = "looking_right"
    FACE_NOT_VISIBLE = "face_not_visible"
    SUSPICIOUS_OBJECT = "suspicious_object"
```

### Severity Levels

| Level | Description | Example |
|-------|-------------|---------|
| **Critical** | Immediate action required | Phone detected, multiple persons |
| **High** | Significant violation | Book detected, no person in frame |
| **Medium** | Moderate concern | Looking away for extended period |
| **Low** | Minor concern | Brief glances |
| **None** | No issues detected | Student focused on screen |

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pariksha Guardian AI                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   YOLOv8    │    │    Face     │    │  MediaPipe  │        │
│  │  Detector   │    │  Detector   │    │  Face Mesh  │        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │              Cheating Analyzer Engine               │      │
│  │  • Object Classification                            │      │
│  │  • Person Counting                                  │      │
│  │  • Head Pose Estimation                             │      │
│  │  • Severity Classification                          │      │
│  └──────────────────────────┬──────────────────────────┘      │
│                             │                                  │
│                             ▼                                  │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                    Flask REST API                   │      │
│  │  /analyze  /detect_objects  /detect_pose  /health  │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- Python 3.9+
- pip or conda
- (Optional) NVIDIA GPU with CUDA for faster inference

### Quick Start

```bash
# Navigate to model directory
cd src/model

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

### GPU Support (Recommended for Production)

```bash
# For CUDA 11.8
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## 🔌 API Endpoints

### POST `/analyze` - Complete Cheating Analysis

The primary endpoint for real-time proctoring.

**Request:**
```json
{
  "img": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "return_annotated": true
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-12-20T10:30:00.000Z",
  "is_cheating": true,
  "cheating_types": ["phone_detected", "looking_down"],
  "confidence_score": 0.89,
  "warnings": [
    "Phone detected with 89% confidence",
    "Student looking down"
  ],
  "person_count": 1,
  "head_pose": {
    "pitch": 25.5,
    "yaw": -5.2,
    "roll": 2.1,
    "looking_straight": false,
    "direction": "down"
  },
  "severity": "critical",
  "detections": [
    {
      "class_name": "cell phone",
      "confidence": 0.89,
      "bbox": [120, 340, 200, 420],
      "is_cheating_object": true
    }
  ],
  "annotated_image": "data:image/jpeg;base64,..."
}
```

### POST `/detect_objects` - Object Detection Only

Detects all objects in the frame and classifies them.

### POST `/detect_pose` - Head Pose Estimation

Returns head orientation (pitch, yaw, roll) and direction.

### POST `/predict_people` - Person Count (Legacy Compatible)

Returns the number of people detected in frame.

### POST `/predict_pose` - Legacy Pose Detection

Backward-compatible endpoint for existing integrations.

### GET `/health` - Health Check

Returns server status and available endpoints.

---

## 💻 Usage Examples

### TypeScript/React Integration

```typescript
import { analyzeCheating, captureFrameAsBase64 } from '@/model';

// Capture frame from webcam
const video = document.getElementById('webcam') as HTMLVideoElement;
const imageData = captureFrameAsBase64(video);

// Analyze for cheating
const result = await analyzeCheating(imageData, true);

if (result.is_cheating) {
  console.warn('Cheating detected:', result.warnings);
  // Handle cheating incident
}
```

### Python Client

```python
import requests
import base64

def analyze_frame(image_path):
    with open(image_path, 'rb') as f:
        img_data = base64.b64encode(f.read()).decode('utf-8')
    
    response = requests.post(
        'http://localhost:8080/analyze',
        json={'img': f'data:image/jpeg;base64,{img_data}'}
    )
    
    return response.json()
```

---

## 🎯 Custom Model Training

For better accuracy, train a custom YOLO model on exam-specific scenarios:

```bash
# Using Ultralytics CLI
yolo train model=yolov8n.pt data=data.yaml epochs=100 imgsz=640
```

Then update the detector initialization:
```python
detector = YOLOCheatingDetector(model_path='path/to/best.pt')
```

---

## ⚙️ Configuration

### Environment Variables

```bash
PORT=8080
DEBUG=false
VITE_AI_API_URL=http://localhost:8080
```

### Detection Thresholds

Adjust in `cheating_detector.py`:
```python
PITCH_THRESHOLD_UP = -15    # Looking up
PITCH_THRESHOLD_DOWN = 15   # Looking down
YAW_THRESHOLD = 20          # Looking left/right
```

---

## 📁 Project Structure

```
src/model/
├── app.py                 # Flask API server
├── cheating_detector.py   # YOLO detection module
├── mark_detector.py       # Face landmark detection (legacy)
├── pose_estimator.py      # Pose estimation (legacy)
├── index.ts               # TypeScript API client
├── types.ts               # TypeScript type definitions
├── requirements.txt       # Python dependencies
└── assets/                # Model files
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: ultralytics` | `pip install ultralytics` |
| CUDA out of memory | Use smaller model: `yolov8n.pt` |
| Slow inference | Enable GPU or reduce image size |
| Face not detected | Improve lighting, check camera angle |

---

<div align="center">

**Built with ❤️ for Academic Integrity**

[Back to Top](#-pariksha-guardian-nexus---ai-cheating-detection)

</div>

