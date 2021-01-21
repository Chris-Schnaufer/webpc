"""Server side API"""

import json
import logging
import math
import os
import re
from typing import Optional
from osgeo import gdal, osr
from PIL import Image
from flask import Flask, request, send_file, make_response, render_template
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename

app = Flask(__name__)
cors = CORS(app, resources={r"/files": {"origins": "http://127.0.0.1:3000"}})

FILE_SAVE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
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

def _get_epsg(image_path: str) -> Optional[str]:
    """Returns the EPSG of the georeferenced image file
    Args:
        image_path: path of the file to retrieve the EPSG code from
    Return:
        Returns the found EPSG code, or None if it's not found or an error ocurred
    """
    try:
        src = gdal.Open(image_path)

        proj = osr.SpatialReference(wkt=src.GetProjection())

        return proj.GetAttrValue('AUTHORITY', 1)
    except Exception as ex:
        logging.warning("[get_epsg] Exception caught: %s", str(ex))

    return None

def _load_image_info(image_path: str) -> dict:
    """Loads and returns information on the image
    Arguments:
        image_path: the path to the image to load information on
    Returns:
        Returns a dictionary containing the size of the image in pixels, the bounding box of the image, and the SRID (if available).
        If the image is georeferenced, the coordinates of the image's geographic bounding box is returned.
        If the image is NOT georeferenced, the bounding box will be the size of the image.
        The returned 'georeferenced' key will contain True if the image is georeferenced, and False if not.
    """
    epsg = _get_epsg(image_path)
    if epsg is not None:
        src = gdal.Open(image_path)
        ulx, xres, _, uly, _, yres = src.GetGeoTransform()
        lrx = ulx + (src.RasterXSize * xres)
        lry = uly + (src.RasterYSize * yres)
        size = (src.RasterXSize, src.RasterYSize)
        bounds = (ulx, uly, lrx, lry)
        is_georeferenced = True
    else:
        plain_im = Image.open(image_path)
        size = plain_im.size
        bounds = (0, 0, size[0], size[1])
        is_georeferenced = False

    return {'size': size, 'bounds': bounds, 'georeferenced': is_georeferenced, 'epsg': epsg}

def _generate_feature(plot: list, image_info: dict, geometry_properties: dict = None) -> dict:
    """Generates geometric feature, based upon the points and image information passed in, suitable for inclusion to GeoJSON
    Arguments:
        plot: the plot points to convert to GeoJSON in a list with each point as a (x, y) value pair
        image_info: information on the image (see _load_image_info)
    Returns:
        The dictionary fragment containing the feature.
        For example:
            { "type": "Feature",
             "properties": { "id": "4" },
             "geometry": { "type": "Polygon", "coordinates": [ [ [ 73.1, 36.2 ], ...] ] ] }
            }
    """
    return_dict = { 'type': 'Feature', 'properties': {}, 'geometry': { 'type': 'Polygon', 'coordinates': [ ] } }
    return_coords = []
    bounds_x_size = image_info['bounds'][2] - image_info['bounds'][0]
    bounds_y_size = image_info['bounds'][3] - image_info['bounds'][1]

    for point in plot:
        x_pct = point[0] / image_info['size'][0]
        y_pct = point[1] / image_info['size'][1]
        return_coords.append([image_info['bounds'][0] + (x_pct * bounds_x_size), image_info['bounds'][1] + (y_pct * bounds_y_size)])

    # Check for closing the polygon
    if plot[0] != plot[len(plot) - 1]:
        x_pct = plot[0][0] / image_info['size'][0]
        y_pct = plot[0][1] / image_info['size'][1]
        return_coords.append([image_info['bounds'][0] + (x_pct * bounds_x_size), image_info['bounds'][1] + (y_pct * bounds_y_size)])

    return_dict['geometry']['coordinates'].append(return_coords)
    if geometry_properties is not None:
        return_dict['properties'] = geometry_properties

    return return_dict


@app.route('/')
@cross_origin()
def index():
    """Default page"""
    #return 'Resource not found', 400
    print("RENDERING TEMPLATE");
    return render_template('index.html')


@app.route('/files', methods=['GET', 'PUT'])
#@cross_origin(origin='127.0.0.1:3000', headers=['Content-Type','Authorization'])
@cross_origin()
def files() -> tuple:
    """Handles saving uploaded files and fetching existing file names"""
    print("FILES");
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
            img_width, img_height, img_scale = _get_image_dims_scale(file_path, MAX_DISPLAY_IMAGE_PIXEL)
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
@cross_origin()
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
@cross_origin()
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

@app.route('/export/<string:name>', methods=['POST'])
@cross_origin()
def export_plots(name: str = None):
    """Returns the GeoJSON of the plot boundaries"""
    # pylint: disable=too-many-locals,too-many-statements
    if name is None:
        return 'Resource not found', 400

    image_path = os.path.join(FILE_SAVE_PATH, secure_filename(str(name)))
    if not os.path.exists(image_path):
        print('Invalid export plots image requested: "%s"' % name, flush=True)
        return 'Resource not found', 400

    img_type = os.path.splitext(image_path)[1].lstrip('.')
    mimetype = _get_image_mime_type(img_type)
    if not mimetype:
        print('Invalid export plots image type: "%s"' % name, flush=True)
        return 'Resource not found', 400

    # Load image information
    image_info = _load_image_info(image_path)
    epsg = image_info['epsg']
    if not epsg:
        print('Non-georeferenced images are not supported at this time: "%s"' % name, flush=True)
        return 'Not a georeferenced image', 400

    # Get the form contents
    point_scale = float(request.form['point_scale'])
    plot_rows = int(request.form['rows'])
    plot_cols = int(request.form['cols'])
    (top_inset_pct, right_inset_pct, bottom_inset_pct, left_inset_pct) = \
                                [float(pct.strip()) for pct in request.form['inset_pct'].split(',')]
    points = json.loads(request.form['points'])

    # Convert points to original image dimensions
    img_points = [{'x': x / point_scale, 'y': y / point_scale} for (x, y) in points]

    # Loop through and map the points to coordinates. Everything is relative to the first point
    right_seg_dist = {'x': (img_points[2]['x'] - img_points[1]['x']) / plot_rows,
                      'y': (img_points[2]['y'] - img_points[1]['y']) / plot_rows
                     }
    left_seg_dist = {'x': (img_points[3]['x'] - img_points[0]['x']) / plot_rows,
                     'y': (img_points[3]['y'] - img_points[0]['y']) / plot_rows
                    }

    features = []
    plot_index = 1
    for idx_row in range(0, plot_rows):
        # Calculate the top side for the row of plots
        top_lx = img_points[0]['x'] + (idx_row * left_seg_dist['x']) + (left_seg_dist['x'] * top_inset_pct)
        top_ly = img_points[0]['y'] + (idx_row * left_seg_dist['y']) + (left_seg_dist['y'] * top_inset_pct)
        top_rx = img_points[1]['x'] + (idx_row * right_seg_dist['x']) + (right_seg_dist['x'] * top_inset_pct)
        top_ry = img_points[1]['y'] + (idx_row * right_seg_dist['y']) + (right_seg_dist['y'] * top_inset_pct)
        top_slope = (top_ry - top_ly) / (top_rx - top_lx)

        # Calculate the bottom side for the row of plots
        bot_lx = img_points[0]['x'] + ((idx_row + 1) * left_seg_dist['x']) - (left_seg_dist['x'] * bottom_inset_pct)
        bot_ly = img_points[0]['y'] + ((idx_row + 1) * left_seg_dist['y']) - (left_seg_dist['y'] * bottom_inset_pct)
        bot_rx = img_points[1]['x'] + ((idx_row + 1) * right_seg_dist['x']) - (right_seg_dist['x'] * bottom_inset_pct)
        bot_ry = img_points[1]['y'] + ((idx_row + 1) * right_seg_dist['y']) - (right_seg_dist['y'] * bottom_inset_pct)
        bot_slope = (bot_ry - bot_ly) / (bot_rx - bot_lx)

        if math.isnan(top_slope) or math.isnan(bot_slope):
            print('Slope calculations resulted in NaN - top: %s  bottom: %s' % (str(top_slope), str(bot_slope)))
            return 'Invalid point values specified', 400

        for idx_col in range(0, plot_cols):
            top_col_dist = {'x': (top_rx - top_lx) / plot_cols, 'y': (top_ry - top_ly) / plot_cols}
            bot_col_dist = {'x': (bot_rx - bot_lx) / plot_cols, 'y': (bot_ry - bot_ly) / plot_cols}

            # Calculating the left side of the plot for left points
            left_ux = top_lx + (idx_col * top_col_dist['x']) + (top_col_dist['x'] * left_inset_pct)
            left_bx = bot_lx + (idx_col * bot_col_dist['x']) + (bot_col_dist['x'] * left_inset_pct)

            # Calculating the right side of the plot for right points
            right_ux = top_lx + ((idx_col + 1) * top_col_dist['x']) - (top_col_dist['x'] * right_inset_pct)
            right_bx = bot_lx + ((idx_col + 1) * bot_col_dist['x']) - (bot_col_dist['x'] * right_inset_pct)

            ul_pt = {'x': left_ux,  'y': (left_ux - top_lx) * top_slope + top_ly }
            ur_pt = {'x': right_ux, 'y': (right_ux - top_lx) * top_slope + top_ly}
            lr_pt = {'x': right_bx, 'y': (right_bx - bot_lx) * bot_slope + bot_ly}
            ll_pt = {'x': left_bx,  'y': (left_bx - bot_lx) * bot_slope + bot_ly}

            plot = (
                (ul_pt['x'], ul_pt['y']),  # Uppper left
                (ur_pt['x'], ur_pt['y']),  # Upper right
                (lr_pt['x'], lr_pt['y']),  # Lower right
                (ll_pt['x'], ll_pt['y']),  # Lower left
            )

            features.append(_generate_feature(plot, image_info, {'id': plot_index}))
            plot_index += 1


    return_geometry = {
        'type': 'FeatureCollection',
        'name': name,
        'crs': { 'type': 'name', 'properties': { 'name': 'urn:ogc:def:crs:EPSG::%s' % str(epsg) } },
        'features': features
        }

    response = make_response(json.dumps(return_geometry))
    response.headers.set('Content-Type', 'text')
    response.headers.set('Content-Disposition', 'attachment', filename='plots.geojson')

    return response

if __name__ == '__main__':
    app.run(debug=False)

