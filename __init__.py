from server import PromptServer
from aiohttp import web
import os
import torch

chibi_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "dist")
chibi_customs = os.path.join(os.path.dirname(os.path.realpath(__file__)), "customs")
torch._dynamo.config.force_parameter_static_shapes = False

@PromptServer.instance.routes.get("/chibi")
async def get_chibi(_):
    raise web.HTTPFound('./chibi/')

@PromptServer.instance.routes.get("/chibi/{subpath:.*}")
async def get_chibi_root(request):
    subpath = request.match_info.get("subpath");
    subpath = 'index.html' if subpath == '' else subpath
    if subpath.startswith('customs'):
        return get_chibi_customs(subpath)

    return web.FileResponse(os.path.join(chibi_root, subpath))

def get_chibi_customs(subpath):
    path = os.path.join(os.path.dirname(os.path.realpath(__file__)), subpath)
    return web.FileResponse(path) or web.json_response(
        { "files": [os.path.join(dp.replace(path, ''), f)
            for dp, dn, filenames in os.walk(path)
            for f in filenames if os.path.splitext(f)[1] in ['.csv', '.json']]
        })

NODE_CLASS_MAPPINGS = {} # to prevent 'import: failed'
