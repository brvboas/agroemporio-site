"""
Rebuilds the image assets of the site from the raw files in source/.

    photos  source/photos/*                     -> site/assets/img/photos/*.webp
    brands  source/brand-logos/*                -> site/assets/img/brands/*.webp
    logo    source/logo/logo-full-transparent.png -> favicons, app icons, header seal
    social  source/photos/storefront.jpg        -> site/assets/img/og-image.jpg (1200x630)

Requirements: Python 3.9+, Pillow, NumPy, OpenCV (pip install pillow numpy opencv-python).
AVIF logos also need pillow-avif-plugin (or convert them to PNG first).

Usage (from the repository root):   python tools/prepare_images.py

After changing brand logos, copy the printed width/height pairs into the
<img> tags of the brands section in site/index.html.
"""
from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "site" / "assets"

# Raw photo file -> (output name, longest side in px)
PHOTOS = {
    "feed-truck.png": ("feed-truck", 1600),
    "mineral-salt-trough.png": ("mineral-salt-trough", 1100),
    "pharmacy-shelves.jpg": ("pharmacy-shelves", 2200),
    "dog.jpg": ("dog", 1200),
    "cat.jpg": ("cat", 1100),
    "pet-aisle.jpg": ("pet-aisle", 1600),
    "pool.jpg": ("pool", 1600),
    "storefront.jpg": ("storefront", 2200),
}

# Raw logo file -> (output name, background treatment)
#   "white"  remove a white background connected to the edges
#   "corner" remove the background colour found in the top-left corner
#   "keep"   keep as is (logo is white on its own coloured block)
#   None     already transparent
BRANDS = {
    "msd.png": ("msd", "white"),
    "zoetis.webp": ("zoetis", None),
    "boehringer-ingelheim.png": ("boehringer", "corner"),
    "vetnil.webp": ("vetnil", None),
    "microsules.webp": ("microsules", None),
    "organnact.webp": ("organnact", None),
    "bellotto.png": ("bellotto", None),
    "jacto.png": ("jacto", "white"),
    "selaria-m-reis.avif": ("selaria-m-reis", "white"),
    "premier-pet.png": ("premier-pet", None),
    "special-dog-manfrim.webp": ("special-dog", "white"),
    "adimax.jpg": ("adimax", "white"),
    "pedigree.png": ("pedigree", None),
    "gaiolas-londrina.jpg": ("gaiolas-londrina", "white"),
    "hth.png": ("hth", None),
    "tramontina.png": ("tramontina", "white"),
    "trapp.jpg": ("trapp", "keep"),
}

# Every logo is scaled to roughly the same visual area so none dominates the band.
BRAND_TARGET_AREA = 5200 * 1.15 ** 2
BRAND_MAX_BOX = (176, 64)


def remove_background(image: Image.Image, reference=(255, 255, 255), tolerance=40) -> Image.Image:
    """Makes the background transparent, keeping enclosed areas of the same colour."""
    rgba = np.array(image.convert("RGBA"))
    distance = np.sqrt(((rgba[:, :, :3].astype(int) - np.array(reference)) ** 2).sum(axis=2))
    near = (distance < tolerance).astype(np.uint8)
    _, labels = cv2.connectedComponents(near, connectivity=4)
    edge_labels = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = np.isin(labels, list(edge_labels))
    # Soft 1-px edge to avoid a white halo.
    edge = cv2.dilate(background.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    soft = np.clip((distance - tolerance * 0.35) / (tolerance * 0.65), 0, 1)
    alpha = rgba[:, :, 3].astype(float)
    rgba[:, :, 3] = np.where(background, 0, np.where(edge, alpha * soft, alpha)).astype(np.uint8)
    return Image.fromarray(rgba)


def trim(image: Image.Image) -> Image.Image:
    """Crops to the visible (non-transparent) pixels."""
    alpha = np.array(image)[:, :, 3]
    ys, xs = np.nonzero(alpha > 12)
    return image.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def build_photos() -> None:
    out = ASSETS / "img" / "photos"
    out.mkdir(parents=True, exist_ok=True)
    for source, (name, longest) in PHOTOS.items():
        image = ImageOps.exif_transpose(Image.open(ROOT / "source" / "photos" / source)).convert("RGB")
        image.thumbnail((longest, longest), Image.LANCZOS)
        image.save(out / f"{name}.webp", quality=80, method=6)
        print(f"photo  {name:22s} {image.size}")


def build_brands() -> None:
    out = ASSETS / "img" / "brands"
    out.mkdir(parents=True, exist_ok=True)
    for source, (name, mode) in BRANDS.items():
        image = Image.open(ROOT / "source" / "brand-logos" / source).convert("RGBA")
        if mode == "white":
            image = trim(remove_background(image))
        elif mode == "corner":
            corner = tuple(np.array(image)[3, 3, :3].tolist())
            image = trim(remove_background(image, corner, tolerance=60))
        elif mode == "keep":
            # Crop around the white wordmark, keeping some of the coloured block.
            rgb = np.array(image.convert("RGB")).astype(int)
            ys, xs = np.nonzero(rgb.min(axis=2) > 200)
            image = image.crop((xs.min() - 36, ys.min() - 29, xs.max() + 36, ys.max() + 29))
        else:
            image = trim(image)
        image.thumbnail((640, 300), Image.LANCZOS)
        image.save(out / f"{name}.webp", quality=92, method=6)

        w, h = image.size
        scale = min(BRAND_MAX_BOX[0] / w, BRAND_MAX_BOX[1] / h, math.sqrt(BRAND_TARGET_AREA / (w * h)))
        print(f"brand  {name:12s} width=\"{round(w * scale)}\" height=\"{round(h * scale)}\"")


def build_icons_and_social() -> None:
    icons = ASSETS / "img" / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    logo = Image.open(ROOT / "source" / "logo" / "logo-full-transparent.png").convert("RGBA")

    for size in (192, 512):
        logo.resize((size, size), Image.LANCZOS).save(icons / f"icon-{size}.png", optimize=True)
    logo.resize((32, 32), Image.LANCZOS).save(icons / "favicon-32.png", optimize=True)
    logo.resize((48, 48), Image.LANCZOS).save(ROOT / "site" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    logo.resize((720, 720), Image.LANCZOS).save(ASSETS / "img" / "logo" / "logo-seal.webp", quality=90)

    # Apple / maskable icons need an opaque background and a safe margin.
    for size, name in ((180, "apple-touch-icon.png"), (512, "icon-maskable-512.png")):
        canvas = Image.new("RGBA", (size, size), (27, 51, 33, 255))
        pad = int(size * 0.1)
        canvas.alpha_composite(logo.resize((size - 2 * pad, size - 2 * pad), Image.LANCZOS), (pad, pad))
        canvas.convert("RGB").save(icons / name, optimize=True)

    # Social preview: storefront photo cropped to 1200x630.
    photo = Image.open(ROOT / "source" / "photos" / "storefront.jpg").convert("RGB")
    w, h = photo.size
    crop_w = int(h * 1200 / 630)
    if crop_w <= w:
        photo = photo.crop(((w - crop_w) // 2, 0, (w - crop_w) // 2 + crop_w, h))
    photo.resize((1200, 630), Image.LANCZOS).save(ASSETS / "img" / "og-image.jpg", quality=85, optimize=True, progressive=True)
    print("icons, favicon, seal and og-image rebuilt")


if __name__ == "__main__":
    build_photos()
    build_brands()
    build_icons_and_social()
