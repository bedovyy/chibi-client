# Chibi client

A Simple txt2img client for ComfyUI and Stable Diffusion web UI, developed in Vue3.

Chibi, also known as super deformation, or S.D. is a style of caricature originating in Japan, and common in anime and manga[^1]

## Usage

### Installing as ComfyUI extension
- `git clone https://github.com/bedovyy/chibi-client` into the `custom_nodes` directory.
- open `<comfyui_url>/chibi`. It is normally `http://localhost:8188/chibi`

### Installing as Stable Diffusion web UI extension
- go to `Extensions > Install from URL` and input `https://github.com/bedovyy/chibi-client`, then restart UI.
- open `<webui_url>/chibi`. It is normally `http://localhost:7860/chibi`

### Using as standalone
- cloning this repo, then run `npm run dev` or serve with any web server.

## Features
- Very simple txt2img generation.
- Responsive web page for mobile.
- Tagautocomplete for danbooru tags.
- Supporting PWA.

## Demo
You can see the UI from the below page.

https://bedovyy.github.io/chibi-client/

You can test it if you set your comfyui address on settings.
To test from the webpage, The protocol should be https because of mixed content error.
You may use tunnel service like `cloudflared` and ComfyUI should be run with `--enable-cors-header` option.


[^1]: https://en.wikipedia.org/wiki/Chibi_(style)
