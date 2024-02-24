from modules import script_callbacks
from fastapi import FastAPI
from fastapi.responses import RedirectResponse, FileResponse
import os

chibi_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../dist")

def on_app_started(_, app: FastAPI) -> None:
    @app.get("/chibi")
    async def get_chibi():
        return RedirectResponse(url='./chibi/')

    @app.get("/chibi/{subpath:path}")
    async def get_chibi_root(subpath):
        subpath = 'index.html' if subpath == '' else subpath
        return FileResponse(os.path.join(chibi_root, subpath))

script_callbacks.on_app_started(on_app_started)
