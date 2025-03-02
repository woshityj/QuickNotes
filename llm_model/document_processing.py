import pymupdf
import pymupdf4llm
from PIL import Image
import base64
from io import BytesIO
import os

from moviepy.video.io.VideoFileClip import *
import speech_recognition as sr
import tempfile

import subprocess

async def convertBase64PDFToImages(pdf_bytes) -> list[Image.Image]:
    # code to convert PDF to images

    pdf_file = pymupdf.open(stream = pdf_bytes, filetype = "pdf")

    images = []
    for page in pdf_file:
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
        img.save("page-%i.png" % page.number)
    

    return images

async def convertBase64PDFToMarkdown(pdf_bytes) -> str:

    pdf_file = pymupdf.open(stream = pdf_bytes, filetype = "pdf")

    md_text = pymupdf4llm.to_markdown(pdf_file)

    return md_text

# video = mp.VideoFileClip("test_video.mp4")
# # Extract the audio from the video 
# audio_file = video.audio 
# audio_file.write_audiofile("geeksforgeeks.wav") 
  
# # Initialize recognizer 
# r = sr.Recognizer() 
  
# # Load the audio file 
# with sr.AudioFile("geeksforgeeks.wav") as source: 
#     data = r.record(source) 
  
# # Convert speech to text 
# text = r.recognize_whisper(data) 
  
# # Print the text 
# print("\nThe resultant text from video is: \n") 
# print(text)

async def convertVideoToText(bytes_video) -> str:

    audio_file_name = "temp/audio.wav"
    try:
        # video_data = base64.b64decode(base64_video)
        # video_stream = BytesIO(video_data)

        with tempfile.NamedTemporaryFile("wb", suffix = ".mp4", delete=False) as temp_file:
            temp_file.write(bytes_video.getvalue())
            temp_file_path = temp_file.name
        
        # video_clip = VideoFileClip(temp_file_path)

        # with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_file:
        #         temp_file.write(video_data)
        #         temp_file_path = temp_file.name

        print(temp_file_path)
        video_clip = VideoFileClip(temp_file_path)

        audio_file = video_clip.audio
        audio_file.write_audiofile(audio_file_name)

        audio_file.close()
        video_clip.close()

        r = sr.Recognizer()

        with sr.AudioFile(audio_file_name) as source:
            data = r.record(source)
        
        text = r.recognize_whisper(data)

        return text
    except Exception as e:
        raise Exception(f"Failed to process video: {e}")
    finally:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print("Temporary video file removed.")
        
        if 'audio_file' in locals() and os.path.exists(audio_file_name):
            os.remove(audio_file_name)
            print("Temporary audio file removed")



    # except Exception as e:r
    #     raise Exception(f"Failed to process Base64 Video: {e}")