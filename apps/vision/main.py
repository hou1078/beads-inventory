from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional
import re
from collections import defaultdict

import numpy as np
import cv2
import pytesseract

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

def parse_summary_text(text: str):
    t = text.replace("\n", " ").replace("\t", " ")
    patterns = [
        r"([A-Za-z]?\d{1,4})\s*[:：]\s*(\d+)",
        r"([A-Za-z]?\d{1,4})\s*[xX×]\s*(\d+)",
        r"([A-Za-z]?\d{1,4})\s+(\d+)",
    ]
    counts = defaultdict(int)
    for p in patterns:
        for code, num in re.findall(p, t):
            counts[code.upper()] += int(num)

    items = [{"colorCode": k, "count": v} for k, v in counts.items() if v > 0]
    items.sort(key=lambda x: x["colorCode"])
    return items

def ocr_text_from_image(img_bgr: np.ndarray) -> str:
    # 预处理：灰度 -> 放大 -> 二值化
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    gray = cv2.medianBlur(gray, 3)
    thr = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 10
    )

    # OCR：表格/多行文本用 psm 6 比较稳
    config = "--oem 3 --psm 6"
    text = pytesseract.image_to_string(thr, lang="eng", config=config)
    return text

def best_ocr_parse(img_bgr: np.ndarray):
    h, w = img_bgr.shape[:2]

    # 候选1：底部 35%（大多数图纸汇总在底部）
    bottom = img_bgr[int(h * 0.65):h, 0:w]

    # 候选2：全图（有些图纸汇总不在底部）
    full = img_bgr

    candidates = [
        ("ocr_bottom", bottom),
        ("ocr_full", full),
    ]

    best = {"mode": "none", "items": [], "rawText": ""}

    for mode, crop in candidates:
        raw = ocr_text_from_image(crop)
        items = parse_summary_text(raw)
        # 选“解析到的颜色码数量更多”的那份
        if len(items) > len(best["items"]):
            best = {"mode": mode, "items": items, "rawText": raw}

    return best

@app.post("/parse")
async def parse(
    image: Optional[UploadFile] = File(default=None),
    summary_text: Optional[str] = Form(default=None),
):
    # 1) 有 summary_text 就直接解析（你现在的方式）
    if summary_text and summary_text.strip():
        items = parse_summary_text(summary_text)
        return {"mode": "summary_text", "items": items}

    # 2) 没 summary_text 但有图片：走 OCR
    if image is not None:
        data = await image.read()
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)  # 从内存解码图片 :contentReference[oaicite:1]{index=1}
        if img is None:
            return {"mode": "error", "items": [], "hint": "Cannot decode image"}

        best = best_ocr_parse(img)
        # rawText 返回给你调试（不想看可删）
        return best

    return {"mode": "none", "items": [], "hint": "No summary_text and no image provided"}
