#!/usr/bin/env python3
"""다른 학교용 버전(play/)의 게임 파일(play/index.html)과 선생님 가이드(play/guide.html)를 만든다.

기산중 버전(index.html, ranking.html, guide.html)은 건드리지 않는다.
- 게임 코드: play/src/  (기산중 버전 src/ 를 복사해서 학교 이름, 4교시 퀴즈, 랭킹을 뺀 것)
- 그림: images/ 를 함께 쓴다. 가이드 화면 사진은 play/images/guide/ 에 있으면 그것을, 없으면 images/guide/ 것을 쓴다.
- QR 코드: play/qr-game.png
사용법: python3 tools/build_play.py   (필요한 것: pip install pillow qrcode fonttools brotli)
"""
import base64
import io
import json
import re
import sys
import pathlib

from PIL import Image

sys.dont_write_bytecode = True  # tools/__pycache__ 를 남기지 않는다
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build  # noqa: E402  (그림 줄이기, 글꼴 줄이기는 기산중 버전과 똑같이 한다)

ROOT = build.ROOT
PLAY = ROOT / "play"
SRC = PLAY / "src"
GAME_URL = "https://bon17.github.io/dokdo-love-in-action/play/"


def build_qr():
    import qrcode
    qr = qrcode.QRCode(border=2, box_size=12, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(GAME_URL)
    im = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    im.save(PLAY / "qr-game.png")
    buf = io.BytesIO()
    im.resize((360, 360), Image.NEAREST).save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def build_guide(qr):
    """play/src/guide.template.html 의 {{img:이름}} 자리에 가이드 화면 사진을, {{QR}} 자리에 게임 QR 코드를 넣는다."""
    html = (SRC / "guide.template.html").read_text(encoding="utf-8")

    def put(m):
        for folder in (PLAY / "images" / "guide", build.IMAGES / "guide"):
            f = folder / f"{m.group(1)}.webp"
            if f.exists():
                return build.data_uri(f.read_bytes())
        raise SystemExit(f"가이드 그림이 없습니다: {m.group(1)}.webp")

    html = re.sub(r"\{\{img:([\w-]+)\}\}", put, html).replace("{{QR}}", qr)
    out = PLAY / "guide.html"
    out.write_text(html, encoding="utf-8")
    print(f"play/guide.html {out.stat().st_size / 1024:.0f} KB")


def main():
    qr = build_qr()
    build_guide(qr)
    css = (SRC / "style.css").read_text(encoding="utf-8")
    js = "\n".join(p.read_text(encoding="utf-8") for p in sorted((SRC / "js").glob("*.js")))
    html = (SRC / "index.template.html").read_text(encoding="utf-8")
    face, link = build.build_font(css + js + html)
    images, sizes = build.build_images()
    css = css.replace("/*__FONTFACE__*/", face)
    html = html.replace("<!--__FONTLINK__-->", link)
    html = html.replace("/*__CSS__*/", css)
    html = html.replace("/*__IMAGES__*/", "const IMG = " + json.dumps(images, separators=(",", ":")) + ";")
    html = html.replace("/*__JS__*/", js)
    out = PLAY / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"그림 합계 {sum(sizes.values()) / 1024 / 1024:.2f} MB, play/index.html {out.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
