from server import PromptServer
from aiohttp import web
import os

chibi_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "dist")

@PromptServer.instance.routes.get("/chibi")
async def get_chibi(request):
    raise web.HTTPFound('./chibi/')

@PromptServer.instance.routes.get("/chibi/{subpath:.*}")
async def get_chibi_root(request):
    subpath = request.match_info.get("subpath");
    subpath = 'index.html' if subpath == '' else subpath
    return web.FileResponse(os.path.join(chibi_root, subpath))

NODE_CLASS_MAPPINGS = {} # to prevent 'import: failed'
