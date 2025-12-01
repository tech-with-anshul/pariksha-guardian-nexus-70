import base64
import matplotlib.pyplot as plt
from flask import Flask

import os
from flask import request, jsonify
import tensorflow as tf 
import tensorflow_hub as hub 
import cv2 
import numpy as np
from mark_detector import MarkDetector
from pose_estimator import PoseEstimator

app = Flask(__name__)

multiple_people_detector = hub.load("https://tfhub.dev/tensorflow/efficientdet/d0/1")

# Thresholds for head pose detection (in degrees)
PITCH_THRESHOLD_UP = -15  # Looking up threshold
PITCH_THRESHOLD_DOWN = 15  # Looking down threshold
YAW_THRESHOLD = 20  # Looking left/right threshold



def readb64(uri):
   encoded_data = uri.split(',')[1]
   nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
   img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
   img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
   return img


def classify_head_pose(rotation_vector):
    """
    Classify head pose based on rotation vector (pitch, yaw, roll).
    
    Args:
        rotation_vector: Array containing [pitch, yaw, roll] in radians
        
    Returns:
        dict: Contains pose classification and angle values
    """
    # Convert radians to degrees
    pitch = np.degrees(rotation_vector[0])
    yaw = np.degrees(rotation_vector[1])
    roll = np.degrees(rotation_vector[2])
    
    pose_status = {
        'looking_up': False,
        'looking_down': False,
        'looking_left': False,
        'looking_right': False,
        'looking_straight': False,
        'pitch': float(pitch),
        'yaw': float(yaw),
        'roll': float(roll)
    }
    
    # Detect looking up/down based on pitch
    if pitch < PITCH_THRESHOLD_UP:
        pose_status['looking_up'] = True
    elif pitch > PITCH_THRESHOLD_DOWN:
        pose_status['looking_down'] = True
    
    # Detect looking left/right based on yaw
    if yaw < -YAW_THRESHOLD:
        pose_status['looking_left'] = True
    elif yaw > YAW_THRESHOLD:
        pose_status['looking_right'] = True
    
    # If within thresholds, looking straight
    if (abs(pitch) < 10 and abs(yaw) < 10):
        pose_status['looking_straight'] = True
    
    return pose_status


@app.route('/predict_pose', methods = ['GET', 'POST']) 
def predict_pose() : 
    data = request.get_json(force = True) 
    image = r'{}'.format(data['img'])
    print(type(image), image)
    image= readb64(image)
    plt.imshow(image)
    
    height, width = image.shape[0], image.shape[1]
    pose_estimator = PoseEstimator(img_size=(height, width))
    mark_detector = MarkDetector()

    facebox = mark_detector.extract_cnn_facebox(image)
    frame = image
    
    if facebox is not None:
        # Step 2: Detect landmarks. Crop and feed the face area into the
        # mark detector.
        x1, y1, x2, y2 = facebox
        face_img = frame[y1: y2, x1: x2]

        # Run the detection.
        marks = mark_detector.detect_marks(face_img)

        # Convert the locations from local face area to the global image.
        marks *= (x2 - x1)
        marks[:, 0] += x1
        marks[:, 1] += y1

        # Try pose estimation with 68 points.
        pose = pose_estimator.solve_pose_by_68_points(marks)

        # Classify head pose
        pose_classification = classify_head_pose(pose[0])

        # All done. The best way to show the result would be drawing the
        # pose on the frame in realtime.

        # Do you want to see the pose annotation?
        img, pose_vector = pose_estimator.draw_annotation_box(frame, pose[0], pose[1], color=(0, 255, 0))

        # Prepare response
        response = {
            'message': 'face found',
            'pose': {
                'rotation_vector': pose[0].tolist(),
                'translation_vector': pose[1].tolist()
            },
            'head_pose': pose_classification,
            'warnings': []
        }
        
        # Add warnings for suspicious behavior
        if pose_classification['looking_up']:
            response['warnings'].append('Student is looking up')
        if pose_classification['looking_down']:
            response['warnings'].append('Student is looking down')
        if pose_classification['looking_left']:
            response['warnings'].append('Student is looking left')
        if pose_classification['looking_right']:
            response['warnings'].append('Student is looking right')
        
        return jsonify(response)
    else :
        return jsonify({
            'message': 'face not found',
            'pose': None,
            'head_pose': None,
            'warnings': ['No face detected in the frame']
        })




@app.route('/predict_pose_detailed', methods=['GET', 'POST'])
def predict_pose_detailed():
    """
    Enhanced endpoint with detailed pose analysis and visual feedback
    """
    data = request.get_json(force=True)
    image = r'{}'.format(data['img'])
    image = readb64(image)
    
    height, width = image.shape[0], image.shape[1]
    pose_estimator = PoseEstimator(img_size=(height, width))
    mark_detector = MarkDetector()

    facebox = mark_detector.extract_cnn_facebox(image)
    frame = image.copy()
    
    if facebox is not None:
        x1, y1, x2, y2 = facebox
        face_img = frame[y1: y2, x1: x2]

        # Run the detection
        marks = mark_detector.detect_marks(face_img)

        # Convert the locations from local face area to the global image
        marks *= (x2 - x1)
        marks[:, 0] += x1
        marks[:, 1] += y1

        # Pose estimation
        pose = pose_estimator.solve_pose_by_68_points(marks)

        # Classify head pose
        pose_classification = classify_head_pose(pose[0])

        # Draw annotation box
        img_annotated, pose_vector = pose_estimator.draw_annotation_box(
            frame, pose[0], pose[1], 
            color=(0, 255, 0) if pose_classification['looking_straight'] else (255, 0, 0)
        )

        # Draw marks
        mark_detector.draw_marks(img_annotated, marks, color=(0, 255, 0))

        # Draw facebox
        mark_detector.draw_box(img_annotated, [facebox])

        # Add text overlay with pose information
        text_y = 30
        cv2.putText(img_annotated, f"Pitch: {pose_classification['pitch']:.2f}", 
                    (10, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        text_y += 25
        cv2.putText(img_annotated, f"Yaw: {pose_classification['yaw']:.2f}", 
                    (10, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        text_y += 25
        cv2.putText(img_annotated, f"Roll: {pose_classification['roll']:.2f}", 
                    (10, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add warning text
        if not pose_classification['looking_straight']:
            warning_text = ""
            if pose_classification['looking_up']:
                warning_text = "LOOKING UP!"
            elif pose_classification['looking_down']:
                warning_text = "LOOKING DOWN!"
            elif pose_classification['looking_left']:
                warning_text = "LOOKING LEFT!"
            elif pose_classification['looking_right']:
                warning_text = "LOOKING RIGHT!"
            
            cv2.putText(img_annotated, warning_text, (10, height - 20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        # Convert annotated image to base64
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(img_annotated, cv2.COLOR_RGB2BGR))
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        response = {
            'message': 'face found',
            'pose': {
                'rotation_vector': pose[0].tolist(),
                'translation_vector': pose[1].tolist()
            },
            'head_pose': pose_classification,
            'annotated_image': f"data:image/jpeg;base64,{img_base64}",
            'warnings': []
        }
        
        # Add warnings
        if pose_classification['looking_up']:
            response['warnings'].append('Student is looking up')
        if pose_classification['looking_down']:
            response['warnings'].append('Student is looking down')
        if pose_classification['looking_left']:
            response['warnings'].append('Student is looking left')
        if pose_classification['looking_right']:
            response['warnings'].append('Student is looking right')
        
        return jsonify(response)
    else:
        return jsonify({
            'message': 'face not found',
            'pose': None,
            'head_pose': None,
            'annotated_image': None,
            'warnings': ['No face detected in the frame']
        })


@app.route('/predict_people',methods=['GET','POST'])
def predict() : 
    data = request.get_json(force = True)
    image= readb64(data['img'])
    im_width, im_height = image.shape[0], image.shape[1]
    image = image.reshape((1, image.shape[0], image.shape[1], 3))
    
    data = multiple_people_detector(image)

    boxes = data['detection_boxes'].numpy()[0]
    classes = data['detection_classes'].numpy()[0]
    scores = data['detection_scores'].numpy()[0]

    threshold = 0.5
    people = 0
    for i in range(int(data['num_detections'][0])):
        if classes[i] == 1 and scores[i] > threshold:
            people += 1
            ymin, xmin, ymax, xmax = boxes[i]
            (left, right, top, bottom) = (xmin * im_width, xmax * im_width,
                                          ymin * im_height, ymax * im_height)

    return jsonify({ 'people' : int(people) , 'image' : 'image'})


@app.route('/save_img', methods=['GET', 'POST']) 
def save() : 
    data = request.get_json(force = True)
    image = r'{}'.format(data['img'])
    user = data['user']
    image= readb64(image)
    base_dir = os.getcwd()
    path = r"{}\images\{}.jpg".format(base_dir, user[0:-10])
    print(path)
    plt.imsave(path, image)
    return jsonify({'path' : path})


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'loaded',
        'endpoints': [
            '/predict_pose',
            '/predict_pose_detailed',
            '/predict_people',
            '/save_img'
        ]
    })


if __name__ == '__main__':
    # app.run(debug=True)
    app.run(host='0.0.0.0',port=8080)