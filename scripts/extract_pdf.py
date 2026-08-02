# -*- coding: utf-8 -*-
import sys
import fitz

def extract(pdf_path, out_path):
    doc = fitz.open(pdf_path)
    lines = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        lines.append(f"===== PAGE {i+1} =====")
        lines.append(text)
    doc.close()
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"OK: {pdf_path} -> {out_path}, pages={len(lines)}")

if __name__ == "__main__":
    extract(sys.argv[1], sys.argv[2])
