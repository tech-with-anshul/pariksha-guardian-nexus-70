
/**
 * YOLO-based Cheating Detection API Client
 * 
 * This file exports all model-related components, types, and utilities
 * for the AI proctoring system. Provides a clean interface for frontend integration.
 */

import type {
    CheatingAnalysisResponse,
    HealthResponse,
    LegacyPoseResponse,
    MonitoringEvent,
    ObjectDetectionResponse,
    PeopleCountResponse,
    PoseDetectionResponse,
    SaveImageResponse
} from './types';

// Re-export all types
export * from './types';

// ============================================
// Configuration
// ============================================

/**
 * API endpoint configuration
 * Change this to your deployed server URL in production
 */
export const API_ENDPOINT = import.meta.env.VITE_AI_API_URL || 'http://localhost:8080';

/**
 * Default request timeout in milliseconds
 */
const REQUEST_TIMEOUT = 30000;

// ============================================
// Helper Functions
// ============================================

/**
 * Create fetch request with timeout
 */
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Make a POST request to the API
 */
async function apiPost<T>(endpoint: string, data: object): Promise<T> {
  const response = await fetchWithTimeout(`${API_ENDPOINT}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make a GET request to the API
 */
async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetchWithTimeout(`${API_ENDPOINT}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// Main API Functions
// ============================================

/**
 * Perform complete cheating analysis on an image
 * 
 * This is the primary endpoint for real-time proctoring.
 * Detects objects, counts people, estimates head pose, and identifies cheating behaviors.
 * 
 * @param imageData Base64 encoded image data
 * @param returnAnnotated Whether to return an annotated image
 * @returns Complete cheating analysis results
 */
export async function analyzeCheating(
  imageData: string,
  returnAnnotated: boolean = false
): Promise<CheatingAnalysisResponse> {
  try {
    const response = await apiPost<CheatingAnalysisResponse>('/analyze', {
      img: imageData,
      return_annotated: returnAnnotated,
    });
    return response;
  } catch (error) {
    console.error('Error in cheating analysis:', error);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      is_cheating: false,
      cheating_types: [],
      confidence_score: 0,
      warnings: ['Analysis failed - please check your connection'],
      person_count: 0,
      head_pose: null,
      severity: 'none',
      detections: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect objects in an image
 * 
 * @param imageData Base64 encoded image data
 * @returns Detected objects with their classifications
 */
export async function detectObjects(imageData: string): Promise<ObjectDetectionResponse> {
  try {
    const response = await apiPost<ObjectDetectionResponse>('/detect_objects', {
      img: imageData,
    });
    return response;
  } catch (error) {
    console.error('Error in object detection:', error);
    return {
      success: false,
      objects: [],
      total_count: 0,
      cheating_objects_count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect head pose from an image
 * 
 * @param imageData Base64 encoded image data
 * @param useAdvanced Use MediaPipe-based advanced estimation
 * @returns Head pose estimation results
 */
export async function detectHeadPose(
  imageData: string,
  useAdvanced: boolean = false
): Promise<PoseDetectionResponse> {
  try {
    const response = await apiPost<PoseDetectionResponse>('/detect_pose', {
      img: imageData,
      use_advanced: useAdvanced,
    });
    return response;
  } catch (error) {
    console.error('Error in pose detection:', error);
    return {
      success: false,
      face_detected: false,
      message: 'Detection failed',
      head_pose: null,
      warnings: ['Pose detection failed'],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect number of people in the frame (legacy compatible)
 * 
 * @param imageData Base64 encoded image data
 * @returns Count of people detected
 */
export async function detectPeople(imageData: string): Promise<PeopleCountResponse> {
  try {
    const response = await apiPost<PeopleCountResponse>('/predict_people', {
      img: imageData,
    });
    return response;
  } catch (error) {
    console.error('Error detecting people:', error);
    return { 
      people: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Legacy pose detection endpoint (for backward compatibility)
 * 
 * @param imageData Base64 encoded image data
 * @returns Pose detection results in legacy format
 */
export async function detectPose(imageData: string): Promise<LegacyPoseResponse> {
  try {
    const response = await apiPost<LegacyPoseResponse>('/predict_pose', {
      img: imageData,
    });
    return response;
  } catch (error) {
    console.error('Error in pose detection:', error);
    return { 
      message: 'Failed to detect pose',
      pose: null,
      head_pose: null,
      warnings: ['Detection failed'],
    };
  }
}

/**
 * Get detailed pose analysis with annotated image
 * 
 * @param imageData Base64 encoded image data
 * @returns Detailed pose analysis with annotated image
 */
export async function detectPoseDetailed(imageData: string): Promise<LegacyPoseResponse> {
  try {
    const response = await apiPost<LegacyPoseResponse>('/predict_pose_detailed', {
      img: imageData,
    });
    return response;
  } catch (error) {
    console.error('Error in detailed pose detection:', error);
    return { 
      message: 'Failed to detect pose',
      pose: null,
      head_pose: null,
      warnings: ['Detection failed'],
    };
  }
}

/**
 * Save image to the server for evidence/monitoring purposes
 * 
 * @param imageData Base64 encoded image data
 * @param userId User identifier
 * @returns Path to saved image
 */
export async function saveImage(
  imageData: string, 
  userId: string
): Promise<SaveImageResponse> {
  try {
    const response = await apiPost<SaveImageResponse>('/save_img', {
      img: imageData,
      user: userId,
    });
    return response;
  } catch (error) {
    console.error('Error saving image:', error);
    return { 
      success: false,
      path: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check API health status
 * 
 * @returns Health status of the API server
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiGet<HealthResponse>('/health');
    return response;
  } catch (error) {
    console.error('Error checking health:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      detector_status: 'unknown',
      model: 'unknown',
      version: 'unknown',
      endpoints: [],
    };
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert webcam video frame to base64
 * 
 * @param video Video element or ImageData
 * @param quality JPEG quality (0-1)
 * @returns Base64 encoded image string
 */
export function captureFrameAsBase64(
  video: HTMLVideoElement | HTMLCanvasElement,
  quality: number = 0.8
): string {
  const canvas = document.createElement('canvas');
  
  if (video instanceof HTMLVideoElement) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
  } else {
    canvas.width = video.width;
    canvas.height = video.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
  }
  
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Create a monitoring event from analysis results
 * 
 * @param analysis Cheating analysis response
 * @param imageSnapshot Optional image snapshot
 * @returns Monitoring event object
 */
export function createMonitoringEvent(
  analysis: CheatingAnalysisResponse,
  imageSnapshot?: string
): MonitoringEvent | null {
  if (!analysis.is_cheating) {
    return null;
  }
  
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(analysis.timestamp),
    eventType: analysis.cheating_types[0] || 'unknown',
    severity: analysis.severity,
    confidence: analysis.confidence_score,
    imageSnapshot,
    details: analysis.warnings.join('; '),
  };
}

/**
 * Get severity color for UI display
 * 
 * @param severity Severity level
 * @returns Tailwind CSS color class
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    none: 'text-gray-500',
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };
  return colors[severity] || colors.none;
}

/**
 * Get severity background color for UI display
 * 
 * @param severity Severity level
 * @returns Tailwind CSS background color class
 */
export function getSeverityBgColor(severity: string): string {
  const colors: Record<string, string> = {
    none: 'bg-gray-100',
    low: 'bg-green-100',
    medium: 'bg-yellow-100',
    high: 'bg-orange-100',
    critical: 'bg-red-100',
  };
  return colors[severity] || colors.none;
}

/**
 * Format cheating type for display
 * 
 * @param type Cheating type enum value
 * @returns Human-readable string
 */
export function formatCheatingType(type: string): string {
  const formats: Record<string, string> = {
    phone_detected: 'Phone Detected',
    book_detected: 'Book Detected',
    paper_detected: 'Paper/Notes Detected',
    earphone_detected: 'Earphone Detected',
    multiple_persons: 'Multiple People',
    no_person: 'Person Not Visible',
    looking_away: 'Looking Away',
    looking_down: 'Looking Down',
    looking_up: 'Looking Up',
    looking_left: 'Looking Left',
    looking_right: 'Looking Right',
    face_not_visible: 'Face Not Visible',
    suspicious_object: 'Suspicious Object',
  };
  return formats[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

