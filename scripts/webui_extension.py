from modules import script_callbacks
from fastapi import FastAPI
from fastapi.responses import RedirectResponse, FileResponse, JSONResponse
import os

chibi_root = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "dist")

def on_app_started(_, app: FastAPI) -> None:
    @app.get("/chibi")
    async def get_chibi():
        return RedirectResponse(url='./chibi/')

    @app.get("/chibi/{subpath:path}")
    async def get_chibi_root(subpath):
        subpath = 'index.html' if subpath == '' else subpath
        if subpath.startswith('customs'):
            return get_chibi_customs(subpath)

        return FileResponse(os.path.join(chibi_root, subpath))

def get_chibi_customs(subpath):
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), subpath)
    if os.path.isdir(path):
        return JSONResponse(
        { "files": [os.path.join(dp.replace(path, ''), f)
            for dp, dn, filenames in os.walk(path)
            for f in filenames if os.path.splitext(f)[1] in ['.csv', '.json']]
        })
    return FileResponse(path)

script_callbacks.on_app_started(on_app_started)
