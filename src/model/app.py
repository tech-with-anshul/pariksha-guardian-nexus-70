"""
Pariksha Guardian Nexus - AI Proctoring API Server

YOLO-based Cheating Detection REST API for real-time exam proctoring.

Endpoints:
- POST /analyze - Complete cheating analysis
- POST /detect_objects - Object detection only
- POST /detect_pose - Head pose estimation
- POST /predict_people - Person count detection
- POST /predict_pose - Legacy pose detection
- GET /health - Health check

Author: Pariksha Guardian Team
"""

import os
import base64
import json
from datetime import datetime
from typing import Dict, Any, Optional
import logging

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import our cheating detector
from cheating_detector import YOLOCheatingDetector, AdvancedHeadPoseEstimator, CheatingAnalysis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["*"])

# Initialize detectors (lazy loading)
cheating_detector: Optional[YOLOCheatingDetector] = None
advanced_pose_estimator: Optional[AdvancedHeadPoseEstimator] = None


def get_cheating_detector() -> YOLOCheatingDetector:
    """Get or create the cheating detector instance"""
    global cheating_detector
    if cheating_detector is None:
        cheating_detector = YOLOCheatingDetector(confidence_threshold=0.4)
        cheating_detector.initialize()
    return cheating_detector


def get_pose_estimator() -> AdvancedHeadPoseEstimator:
    """Get or create the advanced pose estimator"""
    global advanced_pose_estimator
    if advanced_pose_estimator is None:
        advanced_pose_estimator = AdvancedHeadPoseEstimator()
        advanced_pose_estimator.initialize()
    return advanced_pose_estimator


def decode_base64_image(uri: str) -> np.ndarray:
    """
    Decode base64 encoded image to numpy array.
    
    Args:
        uri: Base64 encoded image string (with or without data URI prefix)
        
    Returns:
        BGR image as numpy array
    """
    try:
        # Handle data URI format
        if ',' in uri:
            encoded_data = uri.split(',')[1]
        else:
            encoded_data = uri
        
        # Decode base64
        img_data = base64.b64decode(encoded_data)
        nparr = np.frombuffer(img_data, np.uint8)
        
        # Decode image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        return img
    
    except Exception as e:
        logger.error(f"Failed to decode image: {e}")
        raise ValueError(f"Invalid image data: {e}")


def encode_image_base64(img: np.ndarray, format: str = 'jpg') -> str:
    """
    Encode numpy array image to base64 string.
    
    Args:
        img: BGR image as numpy array
        format: Image format (jpg or png)
        
    Returns:
        Base64 encoded string with data URI prefix
    """
    try:
        if format.lower() == 'png':
            _, buffer = cv2.imencode('.png', img)
            mime_type = 'image/png'
        else:
            _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
            mime_type = 'image/jpeg'
        
        encoded = base64.b64encode(buffer).decode('utf-8')
        return f"data:{mime_type};base64,{encoded}"
    
    except Exception as e:
        logger.error(f"Failed to encode image: {e}")
        return ""


@app.route('/analyze', methods=['POST'])
def analyze_cheating():
    """
    Complete cheating analysis endpoint.
    
    Performs YOLO object detection, person counting, and head pose estimation.
    
    Request JSON:
        - img: Base64 encoded image
        - return_annotated: Boolean to return annotated image (default: False)
    
    Returns:
        JSON with complete analysis results
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode image
        image = decode_base64_image(data['img'])
        timestamp = datetime.now().isoformat()
        
        # Run analysis
        detector = get_cheating_detector()
        analysis = detector.analyze_frame(image, timestamp)
        
        # Prepare response
        response = {
            'success': True,
            'timestamp': analysis.timestamp,
            'is_cheating': analysis.is_cheating,
            'cheating_types': analysis.cheating_types,
            'confidence_score': analysis.confidence_score,
            'warnings': analysis.warnings,
            'person_count': analysis.person_count,
            'head_pose': analysis.head_pose,
            'severity': analysis.severity,
            'detections': analysis.detections
        }
        
        # Optionally return annotated image
        if data.get('return_annotated', False):
            annotated = detector.draw_detections(image, analysis)
            response['annotated_image'] = encode_image_base64(annotated)
        
        return jsonify(response)
    
    except ValueError as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({'error': 'Analysis failed', 'success': False}), 500


@app.route('/detect_objects', methods=['POST'])
def detect_objects():
    """
    Object detection only endpoint.
    
    Request JSON:
        - img: Base64 encoded image
    
    Returns:
        JSON with detected objects
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['img'])
        
        detector = get_cheating_detector()
        detections = detector.detect_objects(image)
        
        # Filter for cheating-related objects
        cheating_objects = [
            {
                'class_name': d.class_name,
                'confidence': d.confidence,
                'bbox': list(d.bbox),
                'is_cheating_object': d.is_cheating_object
            }
            for d in detections
        ]
        
        return jsonify({
            'success': True,
            'objects': cheating_objects,
            'total_count': len(detections),
            'cheating_objects_count': sum(1 for d in detections if d.is_cheating_object)
        })
    
    except ValueError as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Object detection error: {e}")
        return jsonify({'error': 'Detection failed', 'success': False}), 500


@app.route('/detect_pose', methods=['POST'])
def detect_pose():
    """
    Head pose estimation endpoint.
    
    Request JSON:
        - img: Base64 encoded image
        - use_advanced: Boolean to use MediaPipe-based estimation (default: False)
    
    Returns:
        JSON with head pose information
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['img'])
        
        if data.get('use_advanced', False):
            # Use MediaPipe-based advanced estimation
            pose_estimator = get_pose_estimator()
            # Convert to RGB for MediaPipe
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pose = pose_estimator.estimate_pose(image_rgb)
        else:
            # Use basic estimation
            detector = get_cheating_detector()
            pose = detector.estimate_head_pose(image)
        
        if pose is None:
            return jsonify({
                'success': True,
                'face_detected': False,
                'message': 'No face detected',
                'head_pose': None,
                'warnings': ['Face not visible in frame']
            })
        
        warnings = []
        if not pose.looking_straight:
            warnings.append(f'Student looking {pose.direction}')
        
        return jsonify({
            'success': True,
            'face_detected': True,
            'message': 'Face detected',
            'head_pose': {
                'pitch': pose.pitch,
                'yaw': pose.yaw,
                'roll': pose.roll,
                'looking_straight': pose.looking_straight,
                'direction': pose.direction
            },
            'warnings': warnings
        })
    
    except ValueError as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Pose detection error: {e}")
        return jsonify({'error': 'Pose detection failed', 'success': False}), 500


@app.route('/predict_people', methods=['GET', 'POST'])
def predict_people():
    """
    Person count detection endpoint (legacy compatible).
    
    Request JSON:
        - img: Base64 encoded image
    
    Returns:
        JSON with person count
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['img'])
        
        detector = get_cheating_detector()
        detections = detector.detect_objects(image)
        person_count = detector.count_persons(detections)
        
        return jsonify({
            'people': person_count,
            'multiple_persons': person_count > 1,
            'no_person': person_count == 0
        })
    
    except ValueError as e:
        return jsonify({'error': str(e), 'people': 0}), 400
    except Exception as e:
        logger.error(f"People detection error: {e}")
        return jsonify({'error': 'Detection failed', 'people': 0}), 500


@app.route('/predict_pose', methods=['GET', 'POST'])
def predict_pose():
    """
    Legacy head pose detection endpoint (backward compatible).
    
    Request JSON:
        - img: Base64 encoded image
    
    Returns:
        JSON with pose information in legacy format
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['img'])
        
        detector = get_cheating_detector()
        pose = detector.estimate_head_pose(image)
        
        if pose is None:
            return jsonify({
                'message': 'face not found',
                'pose': None,
                'head_pose': None,
                'warnings': ['No face detected in the frame']
            })
        
        # Build legacy-compatible response
        warnings = []
        head_pose = {
            'looking_up': pose.direction == 'up',
            'looking_down': pose.direction == 'down',
            'looking_left': pose.direction == 'left',
            'looking_right': pose.direction == 'right',
            'looking_straight': pose.looking_straight,
            'pitch': pose.pitch,
            'yaw': pose.yaw,
            'roll': pose.roll
        }
        
        if head_pose['looking_up']:
            warnings.append('Student is looking up')
        if head_pose['looking_down']:
            warnings.append('Student is looking down')
        if head_pose['looking_left']:
            warnings.append('Student is looking left')
        if head_pose['looking_right']:
            warnings.append('Student is looking right')
        
        return jsonify({
            'message': 'face found',
            'pose': {
                'rotation_vector': [pose.pitch, pose.yaw, pose.roll],
                'translation_vector': [0, 0, 0]
            },
            'head_pose': head_pose,
            'warnings': warnings
        })
    
    except ValueError as e:
        return jsonify({'error': str(e), 'message': 'face not found'}), 400
    except Exception as e:
        logger.error(f"Pose prediction error: {e}")
        return jsonify({'error': 'Detection failed', 'message': 'face not found'}), 500




@app.route('/predict_pose_detailed', methods=['GET', 'POST'])
def predict_pose_detailed():
    """
    Detailed pose detection with annotated image.
    
    Request JSON:
        - img: Base64 encoded image
    
    Returns:
        JSON with detailed pose info and annotated image
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['img'])
        timestamp = datetime.now().isoformat()
        
        detector = get_cheating_detector()
        analysis = detector.analyze_frame(image, timestamp)
        
        # Draw annotations
        annotated = detector.draw_detections(image, analysis)
        annotated_base64 = encode_image_base64(annotated)
        
        # Build legacy-compatible response
        warnings = analysis.warnings
        head_pose = analysis.head_pose
        
        return jsonify({
            'message': 'face found' if analysis.person_count > 0 else 'face not found',
            'pose': {
                'rotation_vector': [head_pose['pitch'], head_pose['yaw'], head_pose['roll']] if head_pose else [0, 0, 0],
                'translation_vector': [0, 0, 0]
            },
            'head_pose': head_pose,
            'annotated_image': annotated_base64,
            'warnings': warnings,
            'cheating_detected': analysis.is_cheating,
            'severity': analysis.severity,
            'detections': analysis.detections
        })
    
    except ValueError as e:
        return jsonify({'error': str(e), 'message': 'face not found'}), 400
    except Exception as e:
        logger.error(f"Detailed pose prediction error: {e}")
        return jsonify({'error': 'Detection failed', 'message': 'face not found'}), 500


@app.route('/save_img', methods=['GET', 'POST'])
def save_image():
    """
    Save image to server (for evidence/logging purposes).
    
    Request JSON:
        - img: Base64 encoded image
        - user: User identifier
    
    Returns:
        JSON with saved file path
    """
    try:
        data = request.get_json(force=True)
        
        if 'img' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['img'])
        user = data.get('user', 'unknown')
        
        # Create images directory if not exists
        base_dir = os.path.dirname(os.path.abspath(__file__))
        images_dir = os.path.join(base_dir, 'images')
        os.makedirs(images_dir, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        user_clean = user.replace('@', '_').replace('.', '_')[:50]
        filename = f"{user_clean}_{timestamp}.jpg"
        filepath = os.path.join(images_dir, filename)
        
        # Save image
        cv2.imwrite(filepath, image)
        
        return jsonify({
            'success': True,
            'path': filepath,
            'filename': filename
        })
    
    except Exception as e:
        logger.error(f"Save image error: {e}")
        return jsonify({'error': 'Failed to save image', 'path': ''}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    detector_status = "initialized" if cheating_detector is not None else "not_initialized"
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'detector_status': detector_status,
        'model': 'yolov8',
        'version': '2.0.0',
        'endpoints': [
            'POST /analyze - Complete cheating analysis',
            'POST /detect_objects - Object detection',
            'POST /detect_pose - Head pose estimation',
            'POST /predict_people - Person count (legacy)',
            'POST /predict_pose - Pose detection (legacy)',
            'POST /predict_pose_detailed - Detailed pose with image',
            'POST /save_img - Save image',
            'GET /health - Health check'
        ]
    })


@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API information"""
    return jsonify({
        'name': 'Pariksha Guardian Nexus - AI Proctoring API',
        'version': '2.0.0',
        'description': 'YOLO-based cheating detection for exam proctoring',
        'documentation': '/health for available endpoints'
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Pre-initialize detector on startup
    logger.info("Starting Pariksha Guardian AI Proctoring Server...")
    
    # Initialize detector
    try:
        detector = get_cheating_detector()
        logger.info("YOLO detector initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to pre-initialize detector: {e}")
        logger.info("Detector will be initialized on first request")
    
    # Run server
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Server starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)