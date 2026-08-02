# -*- coding: utf-8 -*-
import sys
import fitz

pdf_path = sys.argv[1]
doc = fitz.open(pdf_path)
print(f"total pages: {len(doc)}")
for i, page in enumerate(doc):
    text = page.get_text("text").strip()
    imgs = page.get_images()
    print(f"--- page {i+1}: text_len={len(text)}, images={len(imgs)}")
doc.close()
