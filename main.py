"""Server side API"""

import json
import os
import re
from PIL import Image
from typing import Optional
from flask import Flask, request, send_file
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename

app = Flask(__name__)
cors = CORS(app, resources={r"/files": {"origins": "http://127.0.0.1:3000"}})

FILE_SAVE_PATH = os.path.join(os.getcwd(), 'uploads')
FILE_DISPLAY_PATH = os.path.join(FILE_SAVE_PATH, 'display')
FILE_THUMBNAIL_PATH = os.path.join(FILE_SAVE_PATH, 'thumbnails')
MAX_DISPLAY_IMAGE_PIXEL = 1000
MAX_THUMBNAIL_PIXEL = 100

IMAGE_MIME_MAP = {
    'cur': 'x-icon',
    'ico': 'x-icon',
    'jpg': 'jpeg',
    'jfif': 'jpeg',
    'pjpeg': 'jpeg',
    'pjp': 'jpeg',
    'svg': 'svg+xml',
    'tif': 'tiff',
}

def _get_image_mime_type(image_type: str) -> Optional[str]:
    """Returns the image type corresponding MIME type
    Arguments:
        image_type: the type of image (typically the extension portion of the file name)
    Returns:
        The image MIME type when found, or None
    """
    if image_type in IMAGE_MIME_MAP:
        mimetype = 'image/' + IMAGE_MIME_MAP[image_type]
    else:
        mimetype = 'image/' + image_type

    if mimetype == 'image/':
        return None

    return mimetype


def _get_image_dims_scale(source_image: str, max_dimension_pixel: int) -> tuple:
    """Returns the image scale factor between the image size and the specified maximum dimension
    Arguments:
        source_image: the source image to scale
        max_dimension_pixel: the number of pixels in the largest dimension
    Returns:
        A tuple containing the image's width, height, and scale factor
    """
    source = Image.open(source_image)
    if source.width <= 0 or source.height <= 0:
        raise RuntimeError('Invalid size for image: "%s"' % source_image)

    # Scale along the largest image dimension
    if source.width > source.height:
        return source.width, source.height, float(max_dimension_pixel) / float(source.width)
    
    return source.width, source.height, float(max_dimension_pixel) / float(source.height)



def _generate_sized_image(source_image: str, save_path: str, max_dimension_pixel: int) -> None:
    """Generates an image from the source image keeping the aspect ratio
    Arguments:
        source_image: the source image to generate the display image from
        save_path: where to store the image
        max_dimension_pixel: the number of pixels in the largest dimension
    """
    source = Image.open(source_image)
    if source.width <= 0 or source.height <= 0:
        raise RuntimeError('Invalid size for image: "%s"' % source_image)
    ratio = float(source.width) / float(source.height)

    if source.width > source.height:
        width = int(min(max_dimension_pixel, source.width))
        height = int(width / ratio)
    else:
        height = int(min(max_dimension_pixel, source.height))
        width = int(height * ratio)

    source.thumbnail((width, height))
    source.save(save_path)



@app.route('/')
def index():
    """Default page"""
    return 'Resource not found', 400


@app.route('/files', methods=['GET', 'PUT'])
@cross_origin(origin='127.0.0.1:3000', headers=['Content-Type','Authorization'])
def files() -> tuple:
    """Handles saving uploaded files and fetching existing file names"""
    return_names = []

    if not os.path.exists(FILE_SAVE_PATH):
        os.makedirs(FILE_SAVE_PATH)

    if request.method == 'PUT':
        for file_id in request.files:
            one_file = request.files[file_id]
            save_path = os.path.join(FILE_SAVE_PATH, secure_filename(one_file.filename))
            if os.path.exists(save_path):
                os.unlink(save_path)
            one_file.save(save_path)

    for one_file in os.listdir(FILE_SAVE_PATH):
        file_path = os.path.join(FILE_SAVE_PATH, one_file)
        if not os.path.isdir(file_path) and not one_file[0] == '.':
            file_id = re.sub("[^0-9a-zA-Z]+", "", str(os.path.basename(one_file)))
            img_width, img_height, img_scale = _get_image_dims_scale(file_path, MAX_DISPLAY_IMAGE_PIXEL);
            return_names.append({'name': one_file,
                                 'uri': request.url_root + 'img/' + one_file,
                                 'thumbnail_uri': request.url_root + 'thumb/' + one_file,
                                 'id': file_id,
                                 'width': img_width,
                                 'height': img_height,
                                 'scale': img_scale,
                                 })

    return json.dumps(return_names)


@app.route('/img/<string:name>', methods=['GET'])
def image(name: str = None):
    """Returns the content of an image"""
    if name is None:
        return 'Resource not found', 400

    image_path = os.path.join(FILE_SAVE_PATH, secure_filename(str(name)))
    if not os.path.exists(image_path):
        print('Invalid image requested: "%s"' % name, flush=True)
        return 'Resource not found', 400

    img_type = os.path.splitext(image_path)[1].lstrip('.')
    mimetype = _get_image_mime_type(img_type)
    if not mimetype:
        print('Invalid image type: "%s"' % name, flush=True)
        return 'Resource not found', 400

    # Check for a thumnail and create one if it doesn't exist
    if not os.path.exists(FILE_DISPLAY_PATH):
        os.makedirs(FILE_DISPLAY_PATH)

    file_id = re.sub("[^0-9a-zA-Z]+", "", str(os.path.basename(image_path)))
    display_path = os.path.join(FILE_DISPLAY_PATH, file_id + '.png')
    if not os.path.exists(display_path):
        _generate_sized_image(image_path, display_path, MAX_DISPLAY_IMAGE_PIXEL)

    return send_file(display_path)


@app.route('/thumb/<string:name>', methods=['GET'])
def thumbnail(name: str = None):
    """Returns the thumbnail of an image"""
    if name is None:
        return 'Resource not found', 400

    image_path = os.path.join(FILE_SAVE_PATH, secure_filename(str(name)))
    if not os.path.exists(image_path):
        print('Invalid thumbnail requested: "%s"' % name, flush=True)
        return 'Resource not found', 400

    img_type = os.path.splitext(image_path)[1].lstrip('.')
    mimetype = _get_image_mime_type(img_type)
    if not mimetype:
        print('Invalid thumbnail type: "%s"' % name, flush=True)
        return 'Resource not found', 400

    # Check for a thumnail and create one if it doesn't exist
    if not os.path.exists(FILE_THUMBNAIL_PATH):
        os.makedirs(FILE_THUMBNAIL_PATH)

    file_id = re.sub("[^0-9a-zA-Z]+", "", str(os.path.basename(image_path)))
    thumbnail_path = os.path.join(FILE_THUMBNAIL_PATH, file_id + '.png')
    if not os.path.exists(thumbnail_path):
        _generate_sized_image(image_path, thumbnail_path, MAX_THUMBNAIL_PIXEL)

    return send_file(thumbnail_path)
