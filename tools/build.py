#!/usr/bin/env python3
"""게임 파일(index.html), 선생님용 랭킹 보드(ranking.html), 임장 가이드(guide.html)를 만든다.

src/ 의 HTML, CSS, JS와 images/ 의 그림을 압축해서 HTML 파일 하나로 합친다.
임장 가이드의 게임 화면은 images/guide/ 의 WebP 파일을 그대로 넣는다.
게임 주소 QR 코드(docs/qr-game.png)도 함께 만든다.
사용법: python3 tools/build.py   (필요한 것: pip install pillow qrcode fonttools brotli)
"""
import base64
import io
import json
import os
import pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
IMAGES = ROOT / "images"
OUT = ROOT / "index.html"
GAME_URL = "https://bon17.github.io/dokdo-love-in-action/"
FONT_DIR = ROOT / "fonts"
# fonts/ 폴더에 글꼴 파일이 없을 때 쓰는 인터넷 주소 (눈누 제공)
FONT_CDN = "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff"

# (파일 이름, 가로 최대, 세로 최대, 품질)
BACKGROUNDS = [
    "bg-title", "bg-library", "bg-library-fog", "bg-ending",
    *[f"bg-stage{i}" for i in range(1, 9)],
    "scene-isabu", "scene-gangchi",
    "bg-meiji", "bg-joseon-court", "bg-uldo",
]
SPRITES = {
    "gaji-default": 420, "gaji-surprised": 420, "gaji-sad": 420, "gaji-cheer": 420,
    "char-anyongbok": 460, "fog": 520, "boat-top": 256, "item-gull": 300, "item-lion": 300,
}
# 선생님이 올리면 들어가는 인물 그림 (없으면 대사 창에 동그라미 글자가 나온다)
OPTIONAL_SPRITES = {
    "char-isabu": 460, "char-isabu-bust": 420, "char-fisher": 420, "char-tottori": 420, "char-lee": 420,
    "char-shimane": 420, "char-shim": 420, "char-minister": 420, "char-guard": 420, "char-keeper": 420,
    "char-officer": 420, "char-resident": 420, "char-tourist": 420, "char-kid": 420, "char-student": 420,
    "char-suto": 420,
}
# 전신 그림을 대사 창용으로 자를 곳 (머리~허리)
BUST_CROPS = {"char-anyongbok": (300, 0, 954, 654)}
# icons-facilities.png 속 동그란 아이콘 6개 (등대, 경비대 숙소, 주민숙소, 접안시설, 헬기장, 공항)
FACILITY_CELLS = [(36, 17, 503, 473), (534, 17, 1000, 473), (1031, 17, 1496, 473),
                  (36, 496, 503, 956), (534, 496, 1000, 956), (1031, 496, 1496, 956)]


def webp(im, quality):
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


def data_uri(raw):
    return "data:image/webp;base64," + base64.b64encode(raw).decode()


def build_images():
    out, sizes = {}, {}
    for name in BACKGROUNDS:
        im = Image.open(IMAGES / f"{name}.png").convert("RGB").resize((1280, 720), Image.LANCZOS)
        raw = webp(im, 58)
        out[name], sizes[name] = data_uri(raw), len(raw)
    optional = {k: v for k, v in OPTIONAL_SPRITES.items() if (IMAGES / f"{k}.png").exists()}
    for name, px in {**SPRITES, **optional}.items():
        im = Image.open(IMAGES / f"{name}.png").convert("RGBA")
        if name in BUST_CROPS:
            bust = im.crop(BUST_CROPS[name])
            bust.thumbnail((420, 420), Image.LANCZOS)
            raw = webp(bust, 80)
            out[name + "-bust"], sizes[name + "-bust"] = data_uri(raw), len(raw)
        im.thumbnail((px, px), Image.LANCZOS)
        raw = webp(im, 80)
        out[name], sizes[name] = data_uri(raw), len(raw)
    missing = [k for k in OPTIONAL_SPRITES if k not in optional]
    if missing:
        print("  아직 없는 인물 그림:", ", ".join(missing))
    sheet = Image.open(IMAGES / "icons-facilities.png").convert("RGBA")
    for i, (l, t, r, b) in enumerate(FACILITY_CELLS):
        side = min(r - l, b - t)
        cx, cy = (l + r) // 2, (t + b) // 2
        cell = sheet.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)).resize((200, 200), Image.LANCZOS)
        mask = Image.new("L", (800, 800), 0)
        ImageDraw.Draw(mask).ellipse((4, 4, 796, 796), fill=255)
        cell.putalpha(mask.resize((200, 200), Image.LANCZOS))
        raw = webp(cell, 82)
        out[f"fac-{i}"], sizes[f"fac-{i}"] = data_uri(raw), len(raw)
    return out, sizes


def find_font():
    if os.environ.get("FONT_FILE"):
        return pathlib.Path(os.environ["FONT_FILE"])
    for ext in ("woff2", "woff", "otf", "ttf"):
        found = sorted(FONT_DIR.glob(f"*.{ext}"))
        if found:
            return found[0]
    return None


def ks_hangul():
    """학생 이름을 위해 자주 쓰는 한글 2,350자(KS X 1001 완성형)."""
    out = []
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try:
                out.append(bytes([hi, lo]).decode("euc-kr"))
            except UnicodeDecodeError:
                pass
    return "".join(out)


def build_font(text):
    """fonts/ 폴더의 리디바탕을 게임에 쓰는 글자만 남겨 작게 줄인 뒤 HTML에 넣는다.

    글꼴 파일이 없으면 인터넷(CDN)에서 불러오게 한다."""
    path = find_font()
    if not path:
        face = f"@font-face{{font-family:'RIDIBatang';src:url('{FONT_CDN}') format('woff');font-display:swap}}"
        link = f'<link rel="preload" href="{FONT_CDN}" as="font" type="font/woff" crossorigin>'
        print("  글꼴: fonts/ 폴더에 파일이 없어 인터넷에서 불러옵니다.")
        return face, link
    from fontTools import subset
    from fontTools.ttLib import TTFont
    font = TTFont(str(path))
    chars = set(text) | set(ks_hangul()) | {chr(c) for c in range(0x20, 0x7F)} | {"\u00a0"}
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(text="".join(sorted(chars)))
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    raw = buf.getvalue()
    print(f"  글꼴: {path.name} → 필요한 글자만 남겨 {len(raw) / 1024:.0f} KB")
    face = ("@font-face{font-family:'RIDIBatang';src:url(data:font/woff2;base64,"
            + base64.b64encode(raw).decode() + ") format('woff2');font-display:block}")
    return face, ""


def build_qr():
    import qrcode
    qr = qrcode.QRCode(border=2, box_size=12, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(GAME_URL)
    im = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    im.save(ROOT / "docs" / "qr-game.png")
    buf = io.BytesIO()
    im.resize((360, 360), Image.NEAREST).save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def build_guide():
    """src/guide.template.html 의 {{img:이름}} 자리에 images/guide/이름.webp 를 넣는다."""
    import re
    html = (SRC / "guide.template.html").read_text(encoding="utf-8")

    def put(m):
        f = IMAGES / "guide" / f"{m.group(1)}.webp"
        if not f.exists():
            raise SystemExit(f"가이드 그림이 없습니다: {f}")
        return data_uri(f.read_bytes())

    html = re.sub(r"\{\{img:([\w-]+)\}\}", put, html)
    out = ROOT / "guide.html"
    out.write_text(html, encoding="utf-8")
    print(f"guide.html {out.stat().st_size / 1024:.0f} KB")


def main():
    build_guide()
    css = (SRC / "style.css").read_text(encoding="utf-8")
    js = "\n".join(p.read_text(encoding="utf-8") for p in sorted((SRC / "js").glob("*.js")))
    html = (SRC / "index.template.html").read_text(encoding="utf-8")
    board = (SRC / "ranking.template.html").read_text(encoding="utf-8")
    face, link = build_font(css + js + html + board)
    qr = build_qr()
    board = board.replace("/*__QR__*/", qr).replace("/*__URL__*/", GAME_URL)
    board = board.replace("/*__FONTFACE__*/", face).replace("<!--__FONTLINK__-->", link)
    (ROOT / "ranking.html").write_text(board, encoding="utf-8")
    images, sizes = build_images()
    css = css.replace("/*__FONTFACE__*/", face)
    html = html.replace("<!--__FONTLINK__-->", link)
    html = html.replace("/*__CSS__*/", css)
    html = html.replace("/*__IMAGES__*/", "const IMG = " + json.dumps(images, separators=(",", ":")) + ";")
    html = html.replace("/*__JS__*/", js)
    OUT.write_text(html, encoding="utf-8")
    total = sum(sizes.values())
    for k, v in sorted(sizes.items(), key=lambda kv: -kv[1]):
        print(f"  {k:18s} {v / 1024:7.1f} KB")
    print(f"그림 합계 {total / 1024 / 1024:.2f} MB, index.html {OUT.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
