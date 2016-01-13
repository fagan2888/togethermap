import random
import time
import datetime
from shapely.geometry import shape
# import the meteor python client
from syncify import syncify
from MeteorClient import MeteorClient
from bson.objectid import ObjectId


def createMarker(lat, lng, color="#0000FF", name="No Name Given",
                 description="", icon="building", icon_size="m",
                 properties={}):
    lat, lng = float(lat), float(lng)
    d = {
        "type": "Feature",
        "bbox": {
            "type": "Point",
            "coordinates": [lng, lat]
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat]
        },
        "properties": {
            "color": color,
            "icon_size": icon_size,
            "icon": icon,
            "name": name,
            "description": description
        }
    }
    for k, v in properties.items():
        d["properties"][k] = v
    return d


def add_bbox(p):
    if p['geometry']['type'] in ['Polygon', 'MultiPolygon']:
        bounds = shape(p['geometry']).bounds
        minx, miny, maxx, maxy = bounds
        poly = {
            "type": "Polygon",
            "coordinates": [
                [[minx, miny], [minx, maxy], [maxx, maxy],
                 [maxx, miny], [minx, miny]]
            ]
        }
    else:
        poly = p['geometry']
    p['bbox'] = poly
    return p


def randomColor():
    return "#%06x" % random.randint(0, 0xFFFFFF)


def addTmAttributes(f, cid, user, add_color=True):
    # this creates all the special attributes used by TM so
    # that the user can load places into mongo directly (not
    # through meteor commands), which is more efficient
    f["creatorUID"] = user["_id"]
    f["creator"] = user["profile"]["displayName"]
    f["createDate"] = datetime.datetime.utcnow()
    f["updateDate"] = datetime.datetime.utcnow()
    f["collectionId"] = cid
    f['_id'] = str(ObjectId())
    f["comments_count"] = 0
    if add_color:
        f["properties"]["color"] = randomColor()
    f = add_bbox(f)
    return f


def connect(user, password, server=None, debug=False):
    global CLIENT
    server = server or "wss://togethermap.com/websocket"
    CLIENT = MeteorClient(server, debug=debug, auto_reconnect=False)
    CLIENT.connect()
    # connect takes a sec
    time.sleep(1)
    f = syncify(CLIENT.login)
    return f(user, password)


def call(method, args):
    global CLIENT
    f = syncify(CLIENT.call)
    return f(method, args)


def wait():
    # so this is Python that looks like node - it's all async
    # you have to wait for things to complete
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            break


def getUser():
    return call('myInfo', [])[1]
