
/**
 * Model type definitions for YOLO-based Cheating Detection System
 * 
 * This file contains TypeScript type definitions for the AI proctoring system.
 */

// ============================================
// Enums
// ============================================

/**
 * Types of cheating behaviors that can be detected
 */
export enum CheatingType {
  PHONE_DETECTED = 'phone_detected',
  BOOK_DETECTED = 'book_detected',
  PAPER_DETECTED = 'paper_detected',
  EARPHONE_DETECTED = 'earphone_detected',
  MULTIPLE_PERSONS = 'multiple_persons',
  NO_PERSON = 'no_person',
  LOOKING_AWAY = 'looking_away',
  LOOKING_DOWN = 'looking_down',
  LOOKING_UP = 'looking_up',
  LOOKING_LEFT = 'looking_left',
  LOOKING_RIGHT = 'looking_right',
  FACE_NOT_VISIBLE = 'face_not_visible',
  SUSPICIOUS_OBJECT = 'suspicious_object',
}

/**
 * Severity levels for cheating incidents
 */
export enum CheatingSeverity {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Head pose directions
 */
export enum HeadDirection {
  STRAIGHT = 'straight',
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

// ============================================
// API Request Types
// ============================================

/**
 * Base request with image data
 */
export interface ImageRequest {
  img: string; // Base64 encoded image
}

/**
 * Request for complete cheating analysis
 */
export interface AnalyzeRequest extends ImageRequest {
  return_annotated?: boolean;
}

/**
 * Request for pose detection
 */
export interface PoseDetectionRequest extends ImageRequest {
  use_advanced?: boolean;
}

/**
 * Request for saving images
 */
export interface SaveImageRequest extends ImageRequest {
  user: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Bounding box coordinates [x1, y1, x2, y2]
 */
export type BoundingBox = [number, number, number, number];

/**
 * Single detection result from YOLO
 */
export interface Detection {
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  is_cheating_object: boolean;
}

/**
 * Head pose estimation result
 */
export interface HeadPose {
  pitch: number;        // Up/Down angle in degrees
  yaw: number;          // Left/Right angle in degrees
  roll: number;         // Tilt angle in degrees
  looking_straight: boolean;
  direction: HeadDirection | string;
}

/**
 * Legacy head pose format (for backward compatibility)
 */
export interface LegacyHeadPose {
  looking_up: boolean;
  looking_down: boolean;
  looking_left: boolean;
  looking_right: boolean;
  looking_straight: boolean;
  pitch: number;
  yaw: number;
  roll: number;
}

/**
 * Complete cheating analysis response
 */
export interface CheatingAnalysisResponse {
  success: boolean;
  timestamp: string;
  is_cheating: boolean;
  cheating_types: CheatingType[] | string[];
  confidence_score: number;
  warnings: string[];
  person_count: number;
  head_pose: HeadPose | null;
  severity: CheatingSeverity | string;
  detections: Detection[];
  annotated_image?: string; // Base64 encoded annotated image
  error?: string;
}

/**
 * Object detection response
 */
export interface ObjectDetectionResponse {
  success: boolean;
  objects: Detection[];
  total_count: number;
  cheating_objects_count: number;
  error?: string;
}

/**
 * Pose detection response
 */
export interface PoseDetectionResponse {
  success: boolean;
  face_detected: boolean;
  message: string;
  head_pose: HeadPose | null;
  warnings: string[];
  error?: string;
}

/**
 * Person count response (legacy compatible)
 */
export interface PeopleCountResponse {
  people: number;
  multiple_persons?: boolean;
  no_person?: boolean;
  error?: string;
}

/**
 * Legacy pose response (backward compatibility)
 */
export interface LegacyPoseResponse {
  message: string;
  pose: {
    rotation_vector: number[];
    translation_vector: number[];
  } | null;
  head_pose: LegacyHeadPose | null;
  warnings: string[];
  annotated_image?: string;
  cheating_detected?: boolean;
  severity?: string;
  detections?: Detection[];
}

/**
 * Save image response
 */
export interface SaveImageResponse {
  success: boolean;
  path: string;
  filename?: string;
  error?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  timestamp: string;
  detector_status: string;
  model: string;
  version: string;
  endpoints: string[];
}

// ============================================
// Monitoring & Session Types
// ============================================

/**
 * Monitoring event for real-time tracking
 */
export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  eventType: CheatingType | string;
  severity: CheatingSeverity | string;
  confidence: number;
  imageSnapshot?: string;
  details?: string;
}

/**
 * Monitoring session summary
 */
export interface MonitoringSession {
  sessionId: string;
  userId: string;
  testId: string;
  startTime: Date;
  endTime?: Date;
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  events: MonitoringEvent[];
}

/**
 * Real-time monitoring status
 */
export interface MonitoringStatus {
  isActive: boolean;
  lastAnalysis: Date | null;
  currentSeverity: CheatingSeverity | string;
  warningsCount: number;
  personVisible: boolean;
  faceVisible: boolean;
}

// ============================================
// Base Model Types
// ============================================

export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Utility Types
// ============================================

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  success?: boolean;
  message?: string;
}

/**
 * Type guard for checking if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'error' in response;
}
