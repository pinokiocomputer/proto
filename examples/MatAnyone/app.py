import sys
sys.path.append("../")
sys.path.append("../../")

import os
import json
import time
import psutil
import ffmpeg
import imageio
import argparse
from PIL import Image
import subprocess

import cv2
import torch
import numpy as np
import gradio as gr
 
from tools.painter import mask_painter
from tools.interact_tools import SamControler
# from tools.misc import get_device
from tools.download_util import load_file_from_url

from matanyone_wrapper import matanyone
from matanyone.utils.get_default_model import get_matanyone_model
from matanyone.inference.inference_core import InferenceCore

import warnings
warnings.filterwarnings("ignore")

def parse_augment():
    parser = argparse.ArgumentParser()
    parser.add_argument('--device', type=str, default=None)
    parser.add_argument('--gpu_id', type=str, default=None, help="GPU ID to use (e.g., 0, 1, 2)")
    parser.add_argument('--sam_model_type', type=str, default="vit_h")
    parser.add_argument('--port', type=int, default=8000, help="only useful when running gradio applications")  
    parser.add_argument('--mask_save', default=False)
    args = parser.parse_args()
    
    if not args.device:
        # bypass misc.py and implement device selection directly
        gpu_str = ''
        
        # Validate gpu_id is a valid integer if provided
        if args.gpu_id is not None:
            try:
                gpu_id_int = int(args.gpu_id)
                gpu_str = f':{gpu_id_int}'
            except ValueError:
                print(f"Warning: Invalid GPU ID '{args.gpu_id}'. Expected an integer. Using default GPU.")
        
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            args.device = "mps" + gpu_str
        elif torch.cuda.is_available() and torch.backends.cudnn.is_available():
            args.device = "cuda" + gpu_str
        else:
            args.device = "cpu"

    return args

# SAM generator
class MaskGenerator():
    def __init__(self, sam_checkpoint, args):
        self.args = args
        self.samcontroler = SamControler(sam_checkpoint, args.sam_model_type, args.device)
       
    def first_frame_click(self, image: np.ndarray, points:np.ndarray, labels: np.ndarray, multimask=True):
        mask, logit, painted_image = self.samcontroler.first_frame_click(image, points, labels, multimask)
        return mask, logit, painted_image
    
# convert points input to prompt state
def get_prompt(click_state, click_input):
    inputs = json.loads(click_input)
    points = click_state[0]
    labels = click_state[1]
    for input in inputs:
        points.append(input[:2])
        labels.append(input[2])
    click_state[0] = points
    click_state[1] = labels
    prompt = {
        "prompt_type":["click"],
        "input_point":click_state[0],
        "input_label":click_state[1],
        "multimask_output":"True",
    }
    return prompt

def get_frames_from_image(image_input, image_state):
    frames = [image_input] * 2  # hardcode: mimic a video with 2 frames
    user_name = time.time()
    image_size = (frames[0].shape[0],frames[0].shape[1]) 
    # initialize video_state
    image_state = {
        "user_name": user_name,
        "image_name": "output.png",
        "origin_images": frames,
        "painted_images": frames.copy(),
        "masks": [np.zeros((frames[0].shape[0],frames[0].shape[1]), np.uint8)]*len(frames),
        "logits": [None]*len(frames),
        "select_frame_number": 0,
        "fps": None
        }
    image_info = "Image Name: N/A,\nFPS: N/A,\nTotal Frames: {},\nImage Size:{}".format(len(frames), image_size)
    model.samcontroler.sam_controler.reset_image() 
    model.samcontroler.sam_controler.set_image(image_state["origin_images"][0])
    return image_state, image_info, image_state["origin_images"][0], \
                        gr.update(visible=True, maximum=10, value=10), gr.update(visible=False, maximum=len(frames), value=len(frames)), \
                        gr.update(visible=True), gr.update(visible=True), \
                        gr.update(visible=True), gr.update(visible=True),\
                        gr.update(visible=True), gr.update(visible=True), \
                        gr.update(visible=True), gr.update(visible=True), \
                        gr.update(visible=True), gr.update(visible=True), \
                        gr.update(visible=True), gr.update(visible=True, value=[]), \
                        gr.update(visible=True)

# Add helper function for resizing
def resize_video_frames(frames, max_size):
    """
    Resize video frames if they're too large.
    Maintains aspect ratio and ensures dimensions are compatible with video codecs.
    """
    if not frames or not frames[0].size:
        return frames
        
    frame_height, frame_width = frames[0].shape[:2]
    
    # Check if resize needed
    if max(frame_height, frame_width) <= max_size:
        return frames
        
    # Calculate new dimensions maintaining aspect ratio
    if frame_width > frame_height:
        new_width = max_size
        new_height = int(frame_height * (max_size / frame_width))
    else:
        new_height = max_size
        new_width = int(frame_width * (max_size / frame_height))
    
    # Ensure dimensions are divisible by 16 (round up)
    new_width = ((new_width + 15) // 16) * 16
    new_height = ((new_height + 15) // 16) * 16
        
    # Resize all frames
    resized_frames = [cv2.resize(f, (new_width, new_height), interpolation=cv2.INTER_AREA) for f in frames]
    
    return resized_frames

# Add a function to get video dimensions
def get_video_dimensions(video_path):
    try:
        cap = cv2.VideoCapture(video_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        cap.release()
        return f"Original video dimensions: {width}x{height}, FPS: {fps}"
    except:
        return "Could not determine video dimensions"

# Add function to update video info on upload
def update_video_info(video_path, will_resize=False, target_size=1024):
    if not video_path:
        return gr.update(visible=False, value="")
    
    try:
        cap = cv2.VideoCapture(video_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        cap.release()
        
        dim_info = f"Original video dimensions: {width}x{height}, FPS: {fps}"
        
        if will_resize:
            # Calculate new dimensions
            if width > height:
                new_width = target_size
                new_height = int(height * (target_size / width))
            else:
                new_height = target_size
                new_width = int(width * (target_size / height))
                
            # Round to multiple of 16
            new_width = ((new_width + 15) // 16) * 16
            new_height = ((new_height + 15) // 16) * 16
            
            dim_info += f"\n\nℹ️ Video will be resized to {new_width}x{new_height}"
            
        return gr.update(visible=True, value=dim_info)
    except:
        return gr.update(visible=True, value="Could not determine video dimensions")

# extract frames from upload video
def get_frames_from_video(video_input, video_state, enable_resize=False, max_size=1080):
    if not video_input:
        gr.Warning("Please upload a video first")
        return [video_state] + [gr.update() for _ in range(17)] 
    
    video_path = video_input
    frames = []
    user_name = time.time()

    # extract Audio
    try:
        audio_path = video_path.replace(".mp4", "_audio.wav")
        probe = ffmpeg.probe(video_path)
        audio_streams = [stream for stream in probe['streams'] if stream['codec_type'] == 'audio']
        
        if audio_streams:  # Only try to extract if video has audio
            try:
                ffmpeg.input(video_path).output(audio_path, format='wav', acodec='pcm_s16le', ac=2, ar='44100').run(overwrite_output=True, quiet=True)
            except ffmpeg.Error as e:
                print(f"Audio extraction error: {str(e)}")  # Keep error messages for actual ffmpeg errors
                audio_path = ""
        else:
            audio_path = ""
            print("Note: Input video has no audio track")
    except Exception as e:
        print(f"Error checking audio stream: {str(e)}")  # Keep error messages for probe failures
        audio_path = ""
    
    # extract frames
    try:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        while cap.isOpened():
            ret, frame = cap.read()
            if ret == True:
                current_memory_usage = psutil.virtual_memory().percent
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if current_memory_usage > 90:
                    break
            else:
                break
        cap.release()
    except (OSError, TypeError, ValueError, KeyError, SyntaxError) as e:
        print("read_frame_source:{} error. {}\n".format(video_path, str(e)))

    # Resize frames if enabled
    if enable_resize and frames:
        frames = resize_video_frames(frames, max_size)

    image_size = (frames[0].shape[0], frames[0].shape[1])

    # initialize video_state
    video_state = {
        "user_name": user_name,
        "video_name": os.path.split(video_path)[-1],
        "origin_images": frames,
        "painted_images": frames.copy(),
        "masks": [np.zeros((frames[0].shape[0],frames[0].shape[1]), np.uint8)]*len(frames),
        "logits": [None]*len(frames),
        "select_frame_number": 0,
        "fps": fps,
        "audio": audio_path
    }
    
    video_info = "Video Name: {},\nFPS: {},\nTotal Frames: {},\nImage Size:{}".format(
        video_state["video_name"], 
        round(video_state["fps"], 0), 
        len(frames), 
        image_size
    )
    
    model.samcontroler.sam_controler.reset_image() 
    model.samcontroler.sam_controler.set_image(video_state["origin_images"][0])
    return [video_state, video_info, video_state["origin_images"][0], 
            gr.update(visible=True, maximum=len(frames), value=1), 
            gr.update(visible=False, maximum=len(frames), value=len(frames)),
            gr.update(visible=True), gr.update(visible=True),
            gr.update(visible=True), gr.update(visible=True),
            gr.update(visible=True), gr.update(visible=True),
            gr.update(visible=True), gr.update(visible=False),
            gr.update(visible=False), gr.update(visible=True),
            gr.update(visible=True),
            gr.update(interactive=True),
            gr.update(interactive=True),
            gr.update(visible=True)]

# get the select frame from gradio slider
def select_video_template(image_selection_slider, video_state, interactive_state):

    image_selection_slider -= 1
    video_state["select_frame_number"] = image_selection_slider

    # once select a new template frame, set the image in sam
    model.samcontroler.sam_controler.reset_image()
    model.samcontroler.sam_controler.set_image(video_state["origin_images"][image_selection_slider])

    return video_state["painted_images"][image_selection_slider], video_state, interactive_state

def select_image_template(image_selection_slider, video_state, interactive_state):

    image_selection_slider = 0 # fixed for image
    video_state["select_frame_number"] = image_selection_slider

    # once select a new template frame, set the image in sam
    model.samcontroler.sam_controler.reset_image()
    model.samcontroler.sam_controler.set_image(video_state["origin_images"][image_selection_slider])

    return video_state["painted_images"][image_selection_slider], video_state, interactive_state

# set the tracking end frame
def get_end_number(track_pause_number_slider, video_state, interactive_state):
    interactive_state["track_end_number"] = track_pause_number_slider

    return video_state["painted_images"][track_pause_number_slider],interactive_state

# use sam to get the mask
def sam_refine(video_state, point_prompt, click_state, interactive_state, evt:gr.SelectData):
    """
    Args:
        template_frame: PIL.Image
        point_prompt: flag for positive or negative button click
        click_state: [[points], [labels]]
    """
    if point_prompt == "Positive":
        coordinate = "[[{},{},1]]".format(evt.index[0], evt.index[1])
        interactive_state["positive_click_times"] += 1
    else:
        coordinate = "[[{},{},0]]".format(evt.index[0], evt.index[1])
        interactive_state["negative_click_times"] += 1
    
    # prompt for sam model
    model.samcontroler.sam_controler.reset_image()
    model.samcontroler.sam_controler.set_image(video_state["origin_images"][video_state["select_frame_number"]])
    prompt = get_prompt(click_state=click_state, click_input=coordinate)

    mask, logit, painted_image = model.first_frame_click( 
                                                      image=video_state["origin_images"][video_state["select_frame_number"]], 
                                                      points=np.array(prompt["input_point"]),
                                                      labels=np.array(prompt["input_label"]),
                                                      multimask=prompt["multimask_output"],
                                                      )
    video_state["masks"][video_state["select_frame_number"]] = mask
    video_state["logits"][video_state["select_frame_number"]] = logit
    video_state["painted_images"][video_state["select_frame_number"]] = painted_image

    return painted_image, video_state, interactive_state

def add_multi_mask(video_state, interactive_state, mask_dropdown):
    mask = video_state["masks"][video_state["select_frame_number"]]
    
    # Check if mask is empty or covers the entire frame (all zeros or all ones)
    if mask.size == 0 or np.all(mask == 0) or np.all(mask == 1):
        gr.Warning("Please create a mask by clicking on the image before saving")
        return interactive_state, gr.update(choices=interactive_state["multi_mask"]["mask_names"], value=mask_dropdown), video_state["painted_images"][video_state["select_frame_number"]], [[],[]]
    
    interactive_state["multi_mask"]["masks"].append(mask)
    interactive_state["multi_mask"]["mask_names"].append("mask_{:03d}".format(len(interactive_state["multi_mask"]["masks"])))
    mask_dropdown.append("mask_{:03d}".format(len(interactive_state["multi_mask"]["masks"])))
    select_frame = show_mask(video_state, interactive_state, mask_dropdown)

    return interactive_state, gr.update(choices=interactive_state["multi_mask"]["mask_names"], value=mask_dropdown), select_frame, [[],[]]

def clear_click(video_state, click_state):
    click_state = [[],[]]
    template_frame = video_state["origin_images"][video_state["select_frame_number"]]
    return template_frame, click_state

def remove_multi_mask(interactive_state, mask_dropdown):
    interactive_state["multi_mask"]["mask_names"]= []
    interactive_state["multi_mask"]["masks"] = []

    return interactive_state, gr.update(choices=[],value=[])

def show_mask(video_state, interactive_state, mask_dropdown):
    mask_dropdown.sort()
    if video_state["origin_images"]:
        select_frame = video_state["origin_images"][video_state["select_frame_number"]]
        for i in range(len(mask_dropdown)):
            mask_number = int(mask_dropdown[i].split("_")[1]) - 1
            mask = interactive_state["multi_mask"]["masks"][mask_number]
            select_frame = mask_painter(select_frame, mask.astype('uint8'), mask_color=mask_number+2)
        
        return select_frame

# image matting
def image_matting(video_state, interactive_state, mask_dropdown, erode_kernel_size, dilate_kernel_size, refine_iter, autosave=True):
    matanyone_processor = InferenceCore(matanyone_model, cfg=matanyone_model.cfg)
    if interactive_state["track_end_number"]:
        following_frames = video_state["origin_images"][video_state["select_frame_number"]:interactive_state["track_end_number"]]
    else:
        following_frames = video_state["origin_images"][video_state["select_frame_number"]:]

    if interactive_state["multi_mask"]["masks"]:
        if len(mask_dropdown) == 0:
            mask_dropdown = ["mask_001"]
        mask_dropdown.sort()
        template_mask = interactive_state["multi_mask"]["masks"][int(mask_dropdown[0].split("_")[1]) - 1] * (int(mask_dropdown[0].split("_")[1]))
        for i in range(1,len(mask_dropdown)):
            mask_number = int(mask_dropdown[i].split("_")[1]) - 1 
            template_mask = np.clip(template_mask+interactive_state["multi_mask"]["masks"][mask_number]*(mask_number+1), 0, mask_number+1)
        video_state["masks"][video_state["select_frame_number"]]= template_mask
    else:      
        template_mask = video_state["masks"][video_state["select_frame_number"]]

    # operation error
    if len(np.unique(template_mask))==1:
        template_mask[0][0]=1
    foreground, alpha = matanyone(matanyone_processor, following_frames, template_mask*255, r_erode=erode_kernel_size, r_dilate=dilate_kernel_size, n_warmup=refine_iter, device=args.device)
    
    # Generate output filenames with timestamps
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    fg_output_name = f"image_fg_{timestamp}.png"
    alpha_output_name = f"image_alpha_{timestamp}.png"

    # Create outputs directory
    output_dir = os.path.join(".", "results") if not autosave else os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
    os.makedirs(output_dir, exist_ok=True)
    
    # Save images with consistent naming
    foreground_output = Image.fromarray(foreground[-1])
    alpha_output = Image.fromarray(alpha[-1][:,:,0])
    
    fg_path = os.path.join(output_dir, fg_output_name)
    alpha_path = os.path.join(output_dir, alpha_output_name)
    
    foreground_output.save(fg_path)
    alpha_output.save(alpha_path)

    # Return the paths instead of the PIL Images
    return fg_path, alpha_path


def generate_output_filename(video_name, output_type="fg"):
    # Remove extension from video name and limit length to 32 chars
    base_name = os.path.splitext(video_name)[0][:32]
    # Generate timestamp
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    # Add output type (fg for foreground or alpha for alpha mask)
    suffix = "_fg" if output_type == "fg" else "_alpha"
    
    return f"{base_name}_{timestamp}{suffix}.mp4"

# Add function to open folder
def open_output_folder():
    folder_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
    os.makedirs(folder_path, exist_ok=True)
    
    try:
        if os.name == 'nt':  # Windows
            subprocess.run(['explorer', folder_path])
        elif sys.platform == 'darwin':  # macOS
            subprocess.run(['open', folder_path])
        else:  # Linux
            subprocess.run(['xdg-open', folder_path])
        return "Opened output folder"
    except Exception as e:
        return f"Failed to open folder: {str(e)}"
    
# Video Matting
def video_matting(video_state, interactive_state, mask_dropdown, erode_kernel_size, dilate_kernel_size, autosave=True):
    matanyone_processor = InferenceCore(matanyone_model, cfg=matanyone_model.cfg)
    if interactive_state["track_end_number"]:
        following_frames = video_state["origin_images"][video_state["select_frame_number"]:interactive_state["track_end_number"]]
    else:
        following_frames = video_state["origin_images"][video_state["select_frame_number"]:]

    if interactive_state["multi_mask"]["masks"]:
        if len(mask_dropdown) == 0:
            mask_dropdown = ["mask_001"]
        mask_dropdown.sort()
        template_mask = interactive_state["multi_mask"]["masks"][int(mask_dropdown[0].split("_")[1]) - 1] * (int(mask_dropdown[0].split("_")[1]))
        for i in range(1,len(mask_dropdown)):
            mask_number = int(mask_dropdown[i].split("_")[1]) - 1 
            template_mask = np.clip(template_mask+interactive_state["multi_mask"]["masks"][mask_number]*(mask_number+1), 0, mask_number+1)
        video_state["masks"][video_state["select_frame_number"]]= template_mask
    else:      
        template_mask = video_state["masks"][video_state["select_frame_number"]]
    fps = video_state["fps"]
    audio_path = video_state["audio"]

    # operation error
    if len(np.unique(template_mask))==1:
        template_mask[0][0]=1
    foreground, alpha = matanyone(matanyone_processor, following_frames, template_mask*255, r_erode=erode_kernel_size, r_dilate=dilate_kernel_size, device=args.device)

    # Generate output filenames with timestamps
    fg_output_name = generate_output_filename(video_state["video_name"], output_type="fg")
    alpha_output_name = generate_output_filename(video_state["video_name"], output_type="alpha")

    # Create outputs directory
    output_dir = os.path.join(".", "results") if not autosave else os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate videos with consistent naming
    foreground_output = generate_video_from_frames(foreground, 
        output_path=os.path.join(output_dir, fg_output_name),
        fps=fps, audio_path=audio_path)
    alpha_output = generate_video_from_frames(alpha, 
        output_path=os.path.join(output_dir, alpha_output_name),
        fps=fps, gray2rgb=True, audio_path=audio_path)
    
    return foreground_output, alpha_output


def add_audio_to_video(video_path, audio_path, output_path):
    try:
        video_input = ffmpeg.input(video_path)
        audio_input = ffmpeg.input(audio_path)

        _ = (
            ffmpeg
            .output(video_input, audio_input, output_path, vcodec="copy", acodec="aac")
            .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        )
        return output_path
    except ffmpeg.Error as e:
        print(f"FFmpeg error:\n{e.stderr.decode()}")
        return None


def generate_video_from_frames(frames, output_path, fps=30, gray2rgb=False, audio_path=""):
    """
    Generates a video from a list of frames.
    """
    frames = torch.from_numpy(np.asarray(frames))
    _, h, w, _ = frames.shape
    if gray2rgb:
        frames = np.repeat(frames, 3, axis=3)

    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path))
    
    # Write to a temporary file first
    temp_path = output_path.replace(".mp4", "_temp.mp4") 
    imageio.mimwrite(temp_path, frames, fps=fps, quality=7, 
                     codec='libx264', ffmpeg_params=["-vf", f"scale={w}:{h}"])
    
    # Add audio if it exists, otherwise just rename temp to final
    if audio_path and os.path.exists(audio_path):
        output_path = add_audio_to_video(temp_path, audio_path, output_path)    
        os.remove(temp_path)
        return output_path
    else:
        os.rename(temp_path, output_path)
        return output_path

# reset all states for a new input
def restart():
    return {
            "user_name": "",
            "video_name": "",
            "origin_images": None,
            "painted_images": None,
            "masks": None,
            "inpaint_masks": None,
            "logits": None,
            "select_frame_number": 0,
            "fps": 30,
            "audio": ""
        }, {
            "inference_times": 0,
            "negative_click_times" : 0,
            "positive_click_times": 0,
            "mask_save": args.mask_save,
            "multi_mask": {
                "mask_names": [],
                "masks": []
            },
            "track_end_number": None,
        }, [[],[]], None, None, \
        gr.update(visible=False), gr.update(visible=False), gr.update(visible=False), gr.update(visible=False),\
        gr.update(visible=False), gr.update(visible=False), gr.update(visible=False), gr.update(visible=False), \
        gr.update(visible=False), gr.update(visible=False), gr.update(visible=False), gr.update(visible=False), \
        gr.update(visible=False), gr.update(visible=False, choices=[], value=[]), "", gr.update(visible=False), \
        gr.update(value=False), gr.update(visible=False, value=1024, maximum=2048)  # Reset resize controls

# args, defined in track_anything.py
args = parse_augment()
sam_checkpoint_url_dict = {
    'vit_h': "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth",
    'vit_l': "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth",
    'vit_b': "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
}
checkpoint_folder = os.path.join('..', 'pretrained_models')

sam_checkpoint = load_file_from_url(sam_checkpoint_url_dict[args.sam_model_type], checkpoint_folder)
# initialize sams
model = MaskGenerator(sam_checkpoint, args)

# initialize matanyone
pretrain_model_url = "https://github.com/pq-yang/MatAnyone/releases/download/v1.0.0/matanyone.pth"
ckpt_path = load_file_from_url(os.path.join(pretrain_model_url), checkpoint_folder)
matanyone_model = get_matanyone_model(ckpt_path, args.device)
matanyone_model = matanyone_model.to(args.device).eval()
# matanyone_processor = InferenceCore(matanyone_model, cfg=matanyone_model.cfg)

# download test samples
media_url = "https://github.com/pq-yang/MatAnyone/releases/download/media/"
test_sample_path = os.path.join('.', "test_sample/")
load_file_from_url(os.path.join(media_url, 'test-sample0-720p.mp4'), test_sample_path)
load_file_from_url(os.path.join(media_url, 'test-sample1-720p.mp4'), test_sample_path)
load_file_from_url(os.path.join(media_url, 'test-sample2-720p.mp4'), test_sample_path)
load_file_from_url(os.path.join(media_url, 'test-sample3-720p.mp4'), test_sample_path)
load_file_from_url(os.path.join(media_url, 'test-sample0.jpg'), test_sample_path)
load_file_from_url(os.path.join(media_url, 'test-sample1.jpg'), test_sample_path)

# download assets
assets_path = os.path.join('.', "assets/")
load_file_from_url(os.path.join(media_url, 'tutorial_single_target.mp4'), assets_path)
load_file_from_url(os.path.join(media_url, 'tutorial_multi_targets.mp4'), assets_path)

# documents
title = r"""<div class="multi-layer" align="center"><span>MatAnyone</span></div>
"""
article = r"""
<b>If MatAnyone is proving useful, please take a moment to 🌟 the original <a href='https://github.com/pq-yang/MatAnyone' target='_blank'>Github Repo</a>. Thanks!</b>
"""

my_custom_css = """
.gradio-container {width: 85% !important; margin: 0 auto;}
.gr-monochrome-group {border-radius: 5px !important; border: revert-layer !important; border-width: 2px !important; color: black !important}
button {border-radius: 8px !important;}
.new_button {background-color: #171717 !important; color: #ffffff !important; border: none !important;}
.green_button {background-color: #4CAF50 !important; color: #ffffff !important; border: none !important;}
.new_button:hover {background-color: #4b4b4b !important;}
.green_button:hover {background-color: #77bd79 !important;}

.mask_button_group {gap: 5px !important;}
.video .wrap.svelte-lcpz3o {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: auto !important;
    max-height: 300px !important;
}
.video .wrap.svelte-lcpz3o > :first-child {
    height: auto !important;
    width: 100% !important;
    object-fit: contain !important;
}
.video .container.svelte-sxyn79 {
    display: none !important;
}
.settings-button {
    background-color: var(--neutral-800) !important;
    border: 1px solid rgba(128, 128, 128, 0.2) !important;
    color: #ffffff !important;
    height: 100% !important;  /* Match parent height */
    min-height: 44px !important;  /* Match checkbox height */
}
.settings-button:hover {
    background-color: var(--neutral-700) !important;
    border-color: rgba(128, 128, 128, 0.4) !important;
}
.settings-group {border-bottom: 1px solid rgba(128, 128, 128, 0.2);}
.settings-group:last-child {border-bottom: none;}
"""

#with gr.Blocks(theme=gr.themes.Monochrome(), css=my_custom_css) as demo:
with gr.Blocks() as demo:
    with gr.Tabs():
        with gr.TabItem("Video"):
            click_state = gr.State([[],[]])

            interactive_state = gr.State({
                "inference_times": 0,
                "negative_click_times" : 0,
                "positive_click_times": 0,
                "mask_save": args.mask_save,
                "multi_mask": {
                    "mask_names": [],
                    "masks": []
                },
                "track_end_number": None,
                }
            )

            video_state = gr.State(
                {
                "user_name": "",
                "video_name": "",
                "origin_images": None,
                "painted_images": None,
                "masks": None,
                "inpaint_masks": None,
                "logits": None,
                "select_frame_number": 0,
                "fps": 30,
                "audio": "",
                }
            )

            with gr.Group(visible=True):
                with gr.Accordion('MatAnyone Video Settings (click to expand)', open=False):
                    with gr.Group(visible=True, elem_classes="settings-group"):  # Output options group
                        with gr.Row():
                            with gr.Column(): 
                                autosave_outputs = gr.Checkbox(
                                    label="Autosave Outputs",
                                    value=False,
                                    info="Automatically save video outputs to './app/outputs' folder",
                                    interactive=True
                                )
                            with gr.Column():
                                open_folder_button = gr.Button("📂 Open Output Folder", size="sm", elem_classes=["new_button", "settings-button"])
                    
                    with gr.Group(visible=True, elem_classes="settings-group"):  # Kernel size group
                        with gr.Row():
                            erode_kernel_size = gr.Slider(label='Erode Kernel Size',
                                                    minimum=0,
                                                    maximum=30,
                                                    step=1,
                                                    value=10,
                                                    info="Erosion on the added mask",
                                                    interactive=True)
                            dilate_kernel_size = gr.Slider(label='Dilate Kernel Size',
                                                    minimum=0,
                                                    maximum=30,
                                                    step=1,
                                                    value=10,
                                                    info="Dilation on the added mask",
                                                    interactive=True)
                    
                    with gr.Group(visible=True, elem_classes="settings-group"):  # Frame selection group
                        with gr.Row():
                            image_selection_slider = gr.Slider(minimum=1, maximum=100, step=1, value=1, label="Start Frame", info="Choose the start frame for target assignment and video matting", visible=False)
                            track_pause_number_slider = gr.Slider(minimum=1, maximum=100, step=1, value=1, label="Track end frame", visible=False)
                        with gr.Row():
                            point_prompt = gr.Radio(
                                choices=["Positive", "Negative"],
                                value="Positive",
                                label="Point Prompt",
                                info="Click to add positive or negative point for target mask",
                                interactive=True,
                                visible=False,
                                min_width=100,
                                scale=1)
                            mask_dropdown = gr.Dropdown(multiselect=True, value=[], label="Mask Selection", info="(de)Select created mask(s) added via Save Mask", visible=False)
            
            gr.HTML('<hr style="border: none; height: 1.5px; background: linear-gradient(to right, #a566b4, #74a781);margin: 5px 0;">')

            with gr.Column():
                # input video
                with gr.Row(equal_height=True):
                    with gr.Column(scale=2): 
                        gr.Markdown("## Upload & Resize Video")
                    with gr.Column(scale=2): 
                        step2_title = gr.Markdown("## Masking: <small> (Click to mask. **`Save Mask`** to add)</small>", visible=False)
                
                with gr.Row(equal_height=True):
                    with gr.Column(scale=2):      
                        video_input = gr.Video(label="Input Video", elem_classes="video")
                        input_video_info = gr.Markdown(visible=False)
                        
                        with gr.Group():
                            gr.Markdown("⚠️ Note: Video can only be resized once, and before `Send to Masking`")
                            enable_resize = gr.Checkbox(
                                label="Resize Large Videos",
                                value=False,
                                info="Enable to automatically resize videos that are too large",
                                interactive=True
                            )
                            max_size = gr.Slider(
                                label="Target Resolution",
                                minimum=256,
                                maximum=2048,
                                step=16,
                                value=1024,
                                info="Maximum dimension will be resized to this value (maintaining aspect ratio)",
                                interactive=True,
                                visible=False
                            )
                            gr.Markdown("🎬 Designed for short-form video")
                        
                        extract_frames_button = gr.Button(value="Send to Masking", interactive=True, elem_classes="new_button")
                        
                    with gr.Column(scale=2):
                        video_info = gr.Textbox(label="Video Info", visible=False)
                        template_frame = gr.Image(label="Start Frame", type="pil",interactive=True, elem_id="template_frame", visible=False, elem_classes="image")
                        with gr.Row(equal_height=True, elem_classes="mask_button_group"):
                            clear_button_click = gr.Button(value="Clear Clicks", interactive=True, visible=False, elem_classes="new_button", min_width=100)
                            add_mask_button = gr.Button(value="Save Mask", interactive=True, visible=False, elem_classes="new_button", min_width=100)
                            remove_mask_button = gr.Button(value="Remove Mask", interactive=True, visible=False, elem_classes="new_button", min_width=100) # no use
                            matting_button = gr.Button(value="Video Matting", interactive=True, visible=False, elem_classes="green_button", min_width=100)
                
                # output video
                with gr.Row(equal_height=True):
                    with gr.Column(scale=2):
                        foreground_video_output = gr.Video(label="Foreground Output", visible=False, elem_classes="video")
                        foreground_output_button = gr.Button(value="Foreground Output", visible=False, elem_classes="new_button")
                    with gr.Column(scale=2):
                        alpha_video_output = gr.Video(label="Alpha Output", visible=False, elem_classes="video")
                        alpha_output_button = gr.Button(value="Alpha Mask Output", visible=False, elem_classes="new_button")
                

            # first step: get the video information 
            extract_frames_button.click(
                fn=get_frames_from_video,
                inputs=[
                    video_input, 
                    video_state,
                    enable_resize,
                    max_size
                ],
                outputs=[video_state, video_info, template_frame,
                        image_selection_slider, track_pause_number_slider, point_prompt, clear_button_click, 
                        add_mask_button, matting_button, template_frame,
                        foreground_video_output, alpha_video_output, foreground_output_button, alpha_output_button, 
                        mask_dropdown, step2_title,
                        enable_resize, max_size]
            )   

            # Update the visibility toggle to also update the info message
            def update_resize_visibility(enabled, video_path):
                if not enabled or not video_path:
                    return {
                        max_size: gr.update(visible=False),
                        input_video_info: update_video_info(video_path, False)
                    }
                
                try:
                    # Get original dimensions
                    cap = cv2.VideoCapture(video_path)
                    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    cap.release()
                    
                    # Set maximum to largest dimension, rounded up to nearest multiple of 16
                    max_dim = max(width, height)
                    max_dim = ((max_dim + 15) // 16) * 16
                    
                    # Don't allow scaling up
                    slider_max = min(2048, max_dim)
                    slider_value = min(1024, max_dim)
                    
                    return {
                        max_size: gr.update(
                            visible=True,
                            maximum=slider_max,
                            value=slider_value
                        ),
                        input_video_info: update_video_info(video_path, True, slider_value)
                    }
                except:
                    # Fallback to default values if video can't be read
                    return {
                        max_size: gr.update(visible=True),
                        input_video_info: update_video_info(video_path, True, 1024)
                    }

            # Update the slider value change handler
            def update_resize_info(value, video_path):
                return update_video_info(video_path, True, value)

            enable_resize.change(
                fn=update_resize_visibility,
                inputs=[enable_resize, video_input],
                outputs=[max_size, input_video_info]
            )

            max_size.change(
                fn=update_resize_info,
                inputs=[max_size, video_input],
                outputs=[input_video_info]
            )

            # second step: select images from slider
            image_selection_slider.release(fn=select_video_template, 
                                        inputs=[image_selection_slider, video_state, interactive_state], 
                                        outputs=[template_frame, video_state, interactive_state], api_name="select_image")
            track_pause_number_slider.release(fn=get_end_number, 
                                        inputs=[track_pause_number_slider, video_state, interactive_state], 
                                        outputs=[template_frame, interactive_state], api_name="end_image")
            
            # click select image to get mask using sam
            template_frame.select(
                fn=sam_refine,
                inputs=[video_state, point_prompt, click_state, interactive_state],
                outputs=[template_frame, video_state, interactive_state]
            )

            # add different mask
            add_mask_button.click(
                fn=add_multi_mask,
                inputs=[video_state, interactive_state, mask_dropdown],
                outputs=[interactive_state, mask_dropdown, template_frame, click_state]
            )

            remove_mask_button.click(
                fn=remove_multi_mask,
                inputs=[interactive_state, mask_dropdown],
                outputs=[interactive_state, mask_dropdown]
            )

            # video matting
            matting_button.click(
                fn=video_matting,
                inputs=[
                    video_state, interactive_state, mask_dropdown, 
                    erode_kernel_size, dilate_kernel_size, autosave_outputs
                ],
                outputs=[foreground_video_output, alpha_video_output]
            )

            # click to get mask
            mask_dropdown.change(
                fn=show_mask,
                inputs=[video_state, interactive_state, mask_dropdown],
                outputs=[template_frame]
            )
            
            # clear input
            video_input.change(
                fn=restart,
                inputs=[],
                outputs=[ 
                    video_state, interactive_state, click_state,
                    foreground_video_output, alpha_video_output, template_frame,
                    image_selection_slider, track_pause_number_slider, point_prompt, clear_button_click, 
                    add_mask_button, matting_button, template_frame, foreground_video_output, alpha_video_output, 
                    remove_mask_button, foreground_output_button, alpha_output_button, mask_dropdown, video_info, step2_title,
                    enable_resize, max_size  # Add resize controls to outputs
                ],
                queue=False,
                show_progress=False)
            
            video_input.clear(
                fn=restart,
                inputs=[],
                outputs=[ 
                    video_state, interactive_state, click_state,
                    foreground_video_output, alpha_video_output, template_frame,
                    image_selection_slider, track_pause_number_slider, point_prompt, clear_button_click, 
                    add_mask_button, matting_button, template_frame, foreground_video_output, alpha_video_output, 
                    remove_mask_button, foreground_output_button, alpha_output_button, mask_dropdown, video_info, step2_title,
                    enable_resize, max_size  # Add resize controls to outputs
                ],
                queue=False,
                show_progress=False)
            
            # points clear
            clear_button_click.click(
                fn = clear_click,
                inputs = [video_state, click_state,],
                outputs = [template_frame,click_state],
            )

            # set example
            with gr.Accordion("📎 Examples (click to expand)", open=False):
                gr.Examples(
                    examples=[os.path.join(os.path.dirname(__file__), "./test_sample/", test_sample) for test_sample in ["test-sample0-720p.mp4", "test-sample1-720p.mp4", "test-sample2-720p.mp4", "test-sample3-720p.mp4"]],
                    inputs=[video_input],
                )

            # video tutorial    
            with gr.Group(visible=True):
                with gr.Row():
                    with gr.Accordion("📕 Video Tutorial (click to expand)", open=False):
                        with gr.Row():
                            with gr.Column():
                                gr.Markdown("### Case 1: Single Target")
                                gr.Video(value="./assets/tutorial_single_target.mp4", elem_classes="video")

                            with gr.Column():
                                gr.Markdown("### Case 2: Multiple Targets")
                                gr.Video(value="./assets/tutorial_multi_targets.mp4", elem_classes="video")

            # Add click handlers in both tabs
            open_folder_button.click(
                fn=open_output_folder,
                inputs=[],
                outputs=[]
            )

        with gr.TabItem("Image"):
            click_state = gr.State([[],[]])

            interactive_state = gr.State({
                "inference_times": 0,
                "negative_click_times" : 0,
                "positive_click_times": 0,
                "mask_save": args.mask_save,
                "multi_mask": {
                    "mask_names": [],
                    "masks": []
                },
                "track_end_number": None,
                }
            )

            image_state = gr.State(
                {
                "user_name": "",
                "image_name": "",
                "origin_images": None,
                "painted_images": None,
                "masks": None,
                "inpaint_masks": None,
                "logits": None,
                "select_frame_number": 0,
                "fps": 30
                }
            )

            with gr.Group(visible=True):
                with gr.Accordion('MatAnyone Image Settings (click to expand)', open=False):
                    with gr.Group(visible=True, elem_classes="settings-group"):  # Output options group
                        with gr.Row():
                            with gr.Column(): 
                                autosave_outputs = gr.Checkbox(
                                    label="Autosave Outputs",
                                    value=False,
                                    info="Automatically save image outputs to './app/outputs' folder",
                                    interactive=True
                                )
                            with gr.Column(): 
                                open_folder_button = gr.Button("📂 Open Output Folder", size="sm", elem_classes=["new_button", "settings-button"])
                    
                    with gr.Group(visible=True, elem_classes="settings-group"):  # Kernel size group
                        with gr.Row():
                            erode_kernel_size = gr.Slider(label='Erode Kernel Size',
                                                    minimum=0,
                                                    maximum=30,
                                                    step=1,
                                                    value=10,
                                                    info="Erosion on the added mask",
                                                    interactive=True)
                            dilate_kernel_size = gr.Slider(label='Dilate Kernel Size',
                                                    minimum=0,
                                                    maximum=30,
                                                    step=1,
                                                    value=10,
                                                    info="Dilation on the added mask",
                                                    interactive=True)
                    
                    with gr.Group(visible=True, elem_classes="settings-group"):  # Frame selection group
                        with gr.Row():
                            image_selection_slider = gr.Slider(minimum=1, maximum=100, step=1, value=1, 
                                label="Num of Refinement Iterations", 
                                info="More iterations → More details & More time", 
                                visible=False)
                        with gr.Row():
                            point_prompt = gr.Radio(
                                choices=["Positive", "Negative"],
                                value="Positive",
                                label="Point Prompt",
                                info="Click to add positive or negative point for target mask",
                                interactive=True,
                                visible=False,
                                min_width=100,
                                scale=1)
                            mask_dropdown = gr.Dropdown(
                                multiselect=True, 
                                value=[], 
                                label="Mask Selection", 
                                info="Choose 1~all mask(s) added in Step 2", 
                                visible=False)

            gr.HTML('<hr style="border: none; height: 1.5px; background: linear-gradient(to right, #a566b4, #74a781);margin: 5px 0;">')

            with gr.Column():
                # input image
                with gr.Row(equal_height=True):
                    with gr.Column(scale=2): 
                        gr.Markdown("## Upload image")
                    with gr.Column(scale=2): 
                        step2_title = gr.Markdown("## Add masks: <small> (Click to mask. **`Save Mask`** to add)</small>", visible=False)
                with gr.Row(equal_height=True):
                    with gr.Column(scale=2):      
                        image_input = gr.Image(label="Input Image", elem_classes="image")
                        extract_frames_button = gr.Button(value="Send to Masking", interactive=True, elem_classes="new_button")
                    with gr.Column(scale=2):
                        image_info = gr.Textbox(label="Image Info", visible=False)
                        template_frame = gr.Image(type="pil", label="Start Frame", interactive=True, elem_id="template_frame", visible=False, elem_classes="image")
                        with gr.Row(equal_height=True, elem_classes="mask_button_group"):
                            clear_button_click = gr.Button(value="Clear Clicks", interactive=True, visible=False, elem_classes="new_button", min_width=100)
                            add_mask_button = gr.Button(value="Save Mask", interactive=True, visible=False, elem_classes="new_button", min_width=100)
                            remove_mask_button = gr.Button(value="Remove Mask", interactive=True, visible=False, elem_classes="new_button", min_width=100)
                            matting_button = gr.Button(value="Image Matting", interactive=True, visible=False, elem_classes="green_button", min_width=100)

                # output image
                with gr.Row(equal_height=True):
                    with gr.Column(scale=2):
                        foreground_image_output = gr.Image(type="pil", label="Foreground Output", visible=False, elem_classes="image")
                        foreground_output_button = gr.Button(value="Foreground Output", visible=False, elem_classes="new_button")
                    with gr.Column(scale=2):
                        alpha_image_output = gr.Image(type="pil", label="Alpha Output", visible=False, elem_classes="image")
                        alpha_output_button = gr.Button(value="Alpha Mask Output", visible=False, elem_classes="new_button")

            # first step: get the image information 
            extract_frames_button.click(
                fn=get_frames_from_image,
                inputs=[
                    image_input, image_state
                ],
                outputs=[image_state, image_info, template_frame,
                        image_selection_slider, track_pause_number_slider,point_prompt, clear_button_click, add_mask_button, matting_button, template_frame,
                        foreground_image_output, alpha_image_output, foreground_output_button, alpha_output_button, mask_dropdown, step2_title]
            )   

            # second step: select images from slider
            image_selection_slider.release(fn=select_image_template, 
                                        inputs=[image_selection_slider, image_state, interactive_state], 
                                        outputs=[template_frame, image_state, interactive_state], api_name="select_image")
            track_pause_number_slider.release(fn=get_end_number, 
                                        inputs=[track_pause_number_slider, image_state, interactive_state], 
                                        outputs=[template_frame, interactive_state], api_name="end_image")
            
            # click select image to get mask using sam
            template_frame.select(
                fn=sam_refine,
                inputs=[image_state, point_prompt, click_state, interactive_state],
                outputs=[template_frame, image_state, interactive_state]
            )

            # add different mask
            add_mask_button.click(
                fn=add_multi_mask,
                inputs=[image_state, interactive_state, mask_dropdown],
                outputs=[interactive_state, mask_dropdown, template_frame, click_state]
            )

            remove_mask_button.click(
                fn=remove_multi_mask,
                inputs=[interactive_state, mask_dropdown],
                outputs=[interactive_state, mask_dropdown]
            )

            # image matting
            matting_button.click(
                fn=image_matting,
                inputs=[
                    image_state, interactive_state, mask_dropdown, 
                    erode_kernel_size, dilate_kernel_size, image_selection_slider,
                    autosave_outputs
                ],
                outputs=[foreground_image_output, alpha_image_output]
            )

            # click to get mask
            mask_dropdown.change(
                fn=show_mask,
                inputs=[image_state, interactive_state, mask_dropdown],
                outputs=[template_frame]
            )
            
            # clear input
            image_input.change(
                fn=restart,
                inputs=[],
                outputs=[ 
                    image_state,
                    interactive_state,
                    click_state,
                    foreground_image_output, alpha_image_output,
                    template_frame,
                    image_selection_slider , track_pause_number_slider,point_prompt, clear_button_click, 
                    add_mask_button, matting_button, template_frame, foreground_image_output, alpha_image_output, remove_mask_button, foreground_output_button, alpha_output_button, mask_dropdown, image_info, step2_title
                ],
                queue=False,
                show_progress=False)
            
            image_input.clear(
                fn=restart,
                inputs=[],
                outputs=[ 
                    image_state,
                    interactive_state,
                    click_state,
                    foreground_image_output, alpha_image_output,
                    template_frame,
                    image_selection_slider , track_pause_number_slider,point_prompt, clear_button_click, 
                    add_mask_button, matting_button, template_frame, foreground_image_output, alpha_image_output, remove_mask_button, foreground_output_button, alpha_output_button, mask_dropdown, image_info, step2_title
                ],
                queue=False,
                show_progress=False)
            
            # points clear
            clear_button_click.click(
                fn = clear_click,
                inputs = [image_state, click_state,],
                outputs = [template_frame,click_state],
            )

            # set example
            with gr.Accordion("📎 Examples (click to expand)", open=False):
                gr.Examples(
                    examples=[os.path.join(os.path.dirname(__file__), "./test_sample/", test_sample) for test_sample in ["test-sample0.jpg", "test-sample1.jpg"]],
                    inputs=[image_input],
                )

            # Add click handlers in both tabs
            open_folder_button.click(
                fn=open_output_folder,
                inputs=[],
                outputs=[]
            )

    with gr.Accordion("📚 Citation, License & Acknowledgements", open=False):
        gr.Markdown("""
    📑 **Citation**
    <br>
    If our work is useful for your research, please consider citing:
    ```bibtex
    @InProceedings{yang2025matanyone,
         title     = {{MatAnyone}: Stable Video Matting with Consistent Memory Propagation},
         author    = {Yang, Peiqing and Zhou, Shangchen and Zhao, Jixin and Tao, Qingyi and Loy, Chen Change},
         booktitle = {arXiv preprint arXiv:2501.14677},
         year      = {2025}
    }
    ```
    📝 **License**
    <br>
    This project is licensed under <a rel="license" href="https://github.com/pq-yang/MatAnyone/blob/main/LICENSE">S-Lab License 1.0</a>. 
    Redistribution and use for non-commercial purposes should follow this license.
    <br>
    📧 **Contact**
    <br>
    If you have any questions, please feel free to reach me out at <b>peiqingyang99@outlook.com</b>.
    <br>
    👏 **Acknowledgement**
    <br>
    This project is built upon [Cutie](https://github.com/hkchengrex/Cutie), with the interactive demo adapted from [ProPainter](https://github.com/sczhou/ProPainter), leveraging segmentation capabilities from [Segment Anything](https://github.com/facebookresearch/segment-anything). Thanks for their awesome works!
    """)
    gr.Markdown(article)

demo.launch(debug=True)
