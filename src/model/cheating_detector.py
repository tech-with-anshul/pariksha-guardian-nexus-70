"""
YOLO-based Cheating Detection Module for Exam Proctoring

This module implements real-time cheating detection using YOLOv8 for:
- Object detection (phones, books, papers, earphones, etc.)
- Person detection (multiple people in frame)
- Head pose estimation
- Gaze tracking
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CheatingType(Enum):
    """Types of cheating behaviors that can be detected"""
    PHONE_DETECTED = "phone_detected"
    BOOK_DETECTED = "book_detected"
    PAPER_DETECTED = "paper_detected"
    EARPHONE_DETECTED = "earphone_detected"
    MULTIPLE_PERSONS = "multiple_persons"
    NO_PERSON = "no_person"
    LOOKING_AWAY = "looking_away"
    LOOKING_DOWN = "looking_down"
    LOOKING_UP = "looking_up"
    LOOKING_LEFT = "looking_left"
    LOOKING_RIGHT = "looking_right"
    FACE_NOT_VISIBLE = "face_not_visible"
    SUSPICIOUS_OBJECT = "suspicious_object"


@dataclass
class Detection:
    """Represents a single detection from YOLO"""
    class_name: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    is_cheating_object: bool = False


@dataclass
class HeadPose:
    """Head pose estimation results"""
    pitch: float  # Up/Down
    yaw: float    # Left/Right
    roll: float   # Tilt
    looking_straight: bool = True
    direction: str = "straight"


@dataclass
class CheatingAnalysis:
    """Complete cheating analysis result"""
    is_cheating: bool
    cheating_types: List[str]
    confidence_score: float
    warnings: List[str]
    detections: List[Dict]
    person_count: int
    head_pose: Optional[Dict]
    severity: str  # low, medium, high, critical
    timestamp: str


class YOLOCheatingDetector:
    """
    YOLO-based cheating detection for exam proctoring.
    
    Uses YOLOv8 for object detection and custom models for head pose estimation.
    """
    
    # Cheating-related object classes (COCO dataset indices)
    CHEATING_OBJECTS = {
        'cell phone': 67,
        'book': 73,
        'laptop': 63,
        'remote': 65,
        'keyboard': 66,
        'mouse': 64,
        'tablet': -1,  # Custom class if trained
    }
    
    # Additional suspicious objects
    SUSPICIOUS_OBJECTS = {
        'backpack': 24,
        'handbag': 26,
        'suitcase': 28,
        'bottle': 39,  # Could hide notes
    }
    
    # Pose thresholds (in degrees)
    PITCH_THRESHOLD_UP = -15
    PITCH_THRESHOLD_DOWN = 15
    YAW_THRESHOLD = 20
    ROLL_THRESHOLD = 25
    
    def __init__(self, model_path: Optional[str] = None, confidence_threshold: float = 0.5):
        """
        Initialize the YOLO cheating detector.
        
        Args:
            model_path: Path to custom YOLO model (uses default if None)
            confidence_threshold: Minimum confidence for detections
        """
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.face_detector = None
        self.pose_model = None
        self._initialized = False
        self.model_path = model_path
        
    def initialize(self) -> bool:
        """
        Initialize all models. Call this before using detection methods.
        
        Returns:
            bool: True if initialization successful
        """
        try:
            from ultralytics import YOLO
            
            # Load YOLO model
            if self.model_path:
                self.model = YOLO(self.model_path)
                logger.info(f"Loaded custom YOLO model from {self.model_path}")
            else:
                # Use pretrained YOLOv8 model
                self.model = YOLO('yolov8n.pt')
                logger.info("Loaded YOLOv8n pretrained model")
            
            # Initialize face detector for head pose
            self._init_face_detector()
            
            self._initialized = True
            logger.info("YOLO Cheating Detector initialized successfully")
            return True
            
        except ImportError as e:
            logger.error(f"Failed to import ultralytics: {e}")
            logger.info("Please install: pip install ultralytics")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize detector: {e}")
            return False
    
    def _init_face_detector(self):
        """Initialize OpenCV DNN face detector for head pose estimation"""
        try:
            import os
            base_path = os.path.dirname(os.path.abspath(__file__))
            proto_path = os.path.join(base_path, 'assets', 'deploy.prototxt')
            model_path = os.path.join(base_path, 'assets', 'res10_300x300_ssd_iter_140000.caffemodel')
            
            if os.path.exists(proto_path) and os.path.exists(model_path):
                self.face_detector = cv2.dnn.readNetFromCaffe(proto_path, model_path)
                logger.info("Face detector initialized")
            else:
                logger.warning("Face detector model files not found, head pose estimation will be limited")
        except Exception as e:
            logger.warning(f"Could not initialize face detector: {e}")
    
    def detect_objects(self, image: np.ndarray) -> List[Detection]:
        """
        Detect objects in the image using YOLO.
        
        Args:
            image: BGR image (OpenCV format)
            
        Returns:
            List of Detection objects
        """
        if not self._initialized:
            if not self.initialize():
                return []
        
        detections = []
        
        try:
            results = self.model(image, verbose=False)[0]
            
            for box in results.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = results.names[class_id]
                
                if confidence < self.confidence_threshold:
                    continue
                
                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Check if it's a cheating-related object
                is_cheating = self._is_cheating_object(class_name, class_id)
                
                detections.append(Detection(
                    class_name=class_name,
                    confidence=confidence,
                    bbox=(x1, y1, x2, y2),
                    is_cheating_object=is_cheating
                ))
                
        except Exception as e:
            logger.error(f"Object detection error: {e}")
        
        return detections
    
    def _is_cheating_object(self, class_name: str, class_id: int) -> bool:
        """Check if detected object is cheating-related"""
        cheating_names = ['cell phone', 'book', 'laptop', 'remote', 'tablet']
        return class_name.lower() in cheating_names or class_id in self.CHEATING_OBJECTS.values()
    
    def count_persons(self, detections: List[Detection]) -> int:
        """Count number of persons in detections"""
        return sum(1 for d in detections if d.class_name == 'person')
    
    def detect_face(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face in image using OpenCV DNN.
        
        Args:
            image: BGR image
            
        Returns:
            Tuple of (x1, y1, x2, y2) or None if no face found
        """
        if self.face_detector is None:
            return None
        
        try:
            h, w = image.shape[:2]
            blob = cv2.dnn.blobFromImage(
                cv2.resize(image, (300, 300)), 1.0, (300, 300),
                (104.0, 177.0, 123.0), False, False
            )
            self.face_detector.setInput(blob)
            detections = self.face_detector.forward()
            
            # Get the detection with highest confidence
            best_conf = 0
            best_box = None
            
            for i in range(detections.shape[2]):
                confidence = detections[0, 0, i, 2]
                if confidence > 0.5 and confidence > best_conf:
                    best_conf = confidence
                    box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                    best_box = tuple(box.astype(int))
            
            return best_box
            
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return None
    
    def estimate_head_pose(self, image: np.ndarray, face_box: Optional[Tuple[int, int, int, int]] = None) -> Optional[HeadPose]:
        """
        Estimate head pose from face region.
        
        This uses a simplified approach based on face position and aspect ratio.
        For more accurate results, use a dedicated head pose estimation model.
        
        Args:
            image: BGR image
            face_box: Face bounding box (x1, y1, x2, y2)
            
        Returns:
            HeadPose object or None
        """
        if face_box is None:
            face_box = self.detect_face(image)
        
        if face_box is None:
            return None
        
        try:
            x1, y1, x2, y2 = face_box
            face_width = x2 - x1
            face_height = y2 - y1
            face_center_x = (x1 + x2) / 2
            face_center_y = (y1 + y2) / 2
            
            img_h, img_w = image.shape[:2]
            img_center_x = img_w / 2
            img_center_y = img_h / 2
            
            # Estimate yaw (left/right) based on horizontal position
            x_offset = (face_center_x - img_center_x) / img_center_x
            yaw = x_offset * 45  # Approximate degrees
            
            # Estimate pitch (up/down) based on vertical position
            y_offset = (face_center_y - img_center_y) / img_center_y
            pitch = y_offset * 30  # Approximate degrees
            
            # Estimate roll based on face aspect ratio (very rough)
            aspect_ratio = face_width / face_height if face_height > 0 else 1
            roll = (1 - aspect_ratio) * 20 if aspect_ratio < 1 else (aspect_ratio - 1) * -20
            
            # Determine direction
            direction = "straight"
            looking_straight = True
            
            if pitch < self.PITCH_THRESHOLD_UP:
                direction = "up"
                looking_straight = False
            elif pitch > self.PITCH_THRESHOLD_DOWN:
                direction = "down"
                looking_straight = False
            
            if abs(yaw) > self.YAW_THRESHOLD:
                direction = "left" if yaw < 0 else "right"
                looking_straight = False
            
            return HeadPose(
                pitch=round(pitch, 2),
                yaw=round(yaw, 2),
                roll=round(roll, 2),
                looking_straight=looking_straight,
                direction=direction
            )
            
        except Exception as e:
            logger.error(f"Head pose estimation error: {e}")
            return None
    
    def analyze_frame(self, image: np.ndarray, timestamp: str = "") -> CheatingAnalysis:
        """
        Perform complete cheating analysis on a frame.
        
        Args:
            image: BGR image (OpenCV format)
            timestamp: Optional timestamp string
            
        Returns:
            CheatingAnalysis object with all results
        """
        cheating_types = []
        warnings = []
        is_cheating = False
        confidence_score = 0.0
        
        # Detect all objects
        detections = self.detect_objects(image)
        
        # Count persons
        person_count = self.count_persons(detections)
        
        # Check for person count issues
        if person_count == 0:
            cheating_types.append(CheatingType.NO_PERSON.value)
            warnings.append("No person detected in frame")
            is_cheating = True
        elif person_count > 1:
            cheating_types.append(CheatingType.MULTIPLE_PERSONS.value)
            warnings.append(f"Multiple persons detected: {person_count}")
            is_cheating = True
        
        # Check for cheating objects
        cheating_objects = [d for d in detections if d.is_cheating_object]
        for obj in cheating_objects:
            is_cheating = True
            
            if 'phone' in obj.class_name.lower():
                cheating_types.append(CheatingType.PHONE_DETECTED.value)
                warnings.append(f"Phone detected with {obj.confidence:.1%} confidence")
            elif 'book' in obj.class_name.lower():
                cheating_types.append(CheatingType.BOOK_DETECTED.value)
                warnings.append(f"Book detected with {obj.confidence:.1%} confidence")
            elif 'laptop' in obj.class_name.lower():
                cheating_types.append(CheatingType.SUSPICIOUS_OBJECT.value)
                warnings.append(f"Laptop detected with {obj.confidence:.1%} confidence")
            else:
                cheating_types.append(CheatingType.SUSPICIOUS_OBJECT.value)
                warnings.append(f"Suspicious object ({obj.class_name}) detected")
        
        # Estimate head pose
        head_pose = self.estimate_head_pose(image)
        head_pose_dict = None
        
        if head_pose:
            head_pose_dict = {
                'pitch': head_pose.pitch,
                'yaw': head_pose.yaw,
                'roll': head_pose.roll,
                'looking_straight': head_pose.looking_straight,
                'direction': head_pose.direction
            }
            
            if not head_pose.looking_straight:
                is_cheating = True
                
                if head_pose.direction == "up":
                    cheating_types.append(CheatingType.LOOKING_UP.value)
                    warnings.append("Student looking up")
                elif head_pose.direction == "down":
                    cheating_types.append(CheatingType.LOOKING_DOWN.value)
                    warnings.append("Student looking down")
                elif head_pose.direction == "left":
                    cheating_types.append(CheatingType.LOOKING_LEFT.value)
                    warnings.append("Student looking left")
                elif head_pose.direction == "right":
                    cheating_types.append(CheatingType.LOOKING_RIGHT.value)
                    warnings.append("Student looking right")
        else:
            if person_count > 0:
                cheating_types.append(CheatingType.FACE_NOT_VISIBLE.value)
                warnings.append("Face not clearly visible")
                is_cheating = True
        
        # Calculate confidence score
        if is_cheating:
            detection_confidences = [d.confidence for d in cheating_objects]
            if detection_confidences:
                confidence_score = max(detection_confidences)
            else:
                confidence_score = 0.7  # Default for non-object cheating
        
        # Determine severity
        severity = self._calculate_severity(cheating_types, confidence_score)
        
        # Convert detections to dict format
        detections_dict = [
            {
                'class_name': d.class_name,
                'confidence': d.confidence,
                'bbox': list(d.bbox),
                'is_cheating_object': d.is_cheating_object
            }
            for d in detections
        ]
        
        return CheatingAnalysis(
            is_cheating=is_cheating,
            cheating_types=cheating_types,
            confidence_score=confidence_score,
            warnings=warnings,
            detections=detections_dict,
            person_count=person_count,
            head_pose=head_pose_dict,
            severity=severity,
            timestamp=timestamp
        )
    
    def _calculate_severity(self, cheating_types: List[str], confidence: float) -> str:
        """Calculate severity level based on cheating types"""
        critical_types = {
            CheatingType.PHONE_DETECTED.value,
            CheatingType.MULTIPLE_PERSONS.value,
        }
        
        high_types = {
            CheatingType.BOOK_DETECTED.value,
            CheatingType.EARPHONE_DETECTED.value,
            CheatingType.NO_PERSON.value,
        }
        
        if any(t in critical_types for t in cheating_types):
            return "critical"
        elif any(t in high_types for t in cheating_types):
            return "high"
        elif confidence > 0.7:
            return "medium"
        elif cheating_types:
            return "low"
        return "none"
    
    def draw_detections(self, image: np.ndarray, analysis: CheatingAnalysis) -> np.ndarray:
        """
        Draw detection boxes and labels on image.
        
        Args:
            image: BGR image
            analysis: CheatingAnalysis result
            
        Returns:
            Annotated image
        """
        annotated = image.copy()
        
        for det in analysis.detections:
            x1, y1, x2, y2 = det['bbox']
            
            # Color based on whether it's a cheating object
            if det['is_cheating_object']:
                color = (0, 0, 255)  # Red for cheating objects
            elif det['class_name'] == 'person':
                color = (0, 255, 0)  # Green for person
            else:
                color = (255, 255, 0)  # Yellow for other objects
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            
            label = f"{det['class_name']}: {det['confidence']:.2f}"
            cv2.putText(annotated, label, (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Draw warnings at top
        y_offset = 30
        for warning in analysis.warnings[:3]:  # Show top 3 warnings
            cv2.putText(annotated, warning, (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            y_offset += 25
        
        # Draw severity indicator
        severity_colors = {
            'critical': (0, 0, 255),
            'high': (0, 128, 255),
            'medium': (0, 255, 255),
            'low': (0, 255, 0),
            'none': (128, 128, 128)
        }
        severity_color = severity_colors.get(analysis.severity, (128, 128, 128))
        cv2.putText(annotated, f"Severity: {analysis.severity.upper()}",
                   (annotated.shape[1] - 200, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, severity_color, 2)
        
        return annotated


class AdvancedHeadPoseEstimator:
    """
    Advanced head pose estimation using facial landmarks.
    
    Uses MediaPipe Face Mesh for accurate 3D pose estimation.
    """
    
    def __init__(self):
        self.face_mesh = None
        self._initialized = False
    
    def initialize(self) -> bool:
        """Initialize MediaPipe Face Mesh"""
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self._initialized = True
            logger.info("Advanced head pose estimator initialized")
            return True
        except ImportError:
            logger.warning("MediaPipe not available, using basic pose estimation")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize advanced pose estimator: {e}")
            return False
    
    def estimate_pose(self, image: np.ndarray) -> Optional[HeadPose]:
        """
        Estimate head pose using MediaPipe.
        
        Args:
            image: RGB image
            
        Returns:
            HeadPose object or None
        """
        if not self._initialized:
            if not self.initialize():
                return None
        
        try:
            results = self.face_mesh.process(image)
            
            if not results.multi_face_landmarks:
                return None
            
            face_landmarks = results.multi_face_landmarks[0]
            img_h, img_w = image.shape[:2]
            
            # Get key facial landmarks for pose estimation
            # Nose tip, chin, left eye, right eye, left mouth corner, right mouth corner
            face_3d = []
            face_2d = []
            
            key_points = [1, 33, 61, 199, 263, 291]  # MediaPipe landmark indices
            
            for idx in key_points:
                lm = face_landmarks.landmark[idx]
                x, y = int(lm.x * img_w), int(lm.y * img_h)
                face_2d.append([x, y])
                face_3d.append([x, y, lm.z])
            
            face_2d = np.array(face_2d, dtype=np.float64)
            face_3d = np.array(face_3d, dtype=np.float64)
            
            # Camera matrix
            focal_length = img_w
            cam_matrix = np.array([
                [focal_length, 0, img_w / 2],
                [0, focal_length, img_h / 2],
                [0, 0, 1]
            ])
            
            dist_coeffs = np.zeros((4, 1))
            
            # Solve PnP
            success, rotation_vec, translation_vec = cv2.solvePnP(
                face_3d, face_2d, cam_matrix, dist_coeffs
            )
            
            if not success:
                return None
            
            # Convert to rotation matrix and get Euler angles
            rotation_mat, _ = cv2.Rodrigues(rotation_vec)
            angles, _, _, _, _, _ = cv2.RQDecomp3x3(rotation_mat)
            
            pitch = angles[0]
            yaw = angles[1]
            roll = angles[2]
            
            # Determine direction
            direction = "straight"
            looking_straight = True
            
            if pitch < -10:
                direction = "up"
                looking_straight = False
            elif pitch > 10:
                direction = "down"
                looking_straight = False
            
            if yaw < -15:
                direction = "right"
                looking_straight = False
            elif yaw > 15:
                direction = "left"
                looking_straight = False
            
            return HeadPose(
                pitch=round(pitch, 2),
                yaw=round(yaw, 2),
                roll=round(roll, 2),
                looking_straight=looking_straight,
                direction=direction
            )
            
        except Exception as e:
            logger.error(f"Advanced pose estimation error: {e}")
            return None
