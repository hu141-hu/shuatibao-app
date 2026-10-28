# -*- coding: utf-8 -*-
"""把《3500题》上册的 Markdown 题库转换为刷题宝 App 的内置数据模块。

输入：E:\\deepseek\\题库资料\\3500题上册\\输出\\第NN节-*.md
输出：
  src/data/eduQuestions.ts   —— 题目数组（Question[]）
  src/data/eduCategories.ts  —— 三级目录（CategoryHierarchy[]：大标题→章→节）
  src/data/eduKnowledge.ts   —— 每节一个知识点（KnowledgePoint[]）

用法：python scripts/gen-edu-bank.py
"""
import os
import re
import io
import json
import glob

SRC = r"E:\deepseek\题库资料\3500题上册\输出"
APP = r"E:\deepseek\刷题宝\网页版\quiz-app"
TOP_TITLE = "教育学"

TYPE_MAP = {
    "一、单项选择题": "single",
    "二、多项选择题": "multi",
    "三、判断题": "judge",
}
DIFF = {"single": 2, "multi": 3, "judge": 2}
LETTERS = "ABCDEFGH"


def clean(s):
    s = s.replace("\u3000", " ")
    return re.sub(r"[ \t]+", " ", s).strip()


def parse_md(path):
    """解析单个节文件 -> (chapter, sections[list of {title, questions[]}])"""
    txt = io.open(path, encoding="utf-8").read()
    head = re.search(r"^#\s*(.+)$", txt, re.M)
    head_txt = head.group(1).strip() if head else ""
    parts = [p.strip() for p in head_txt.split("·")]
    chapter = parts[0] if parts else ""
    section = parts[1] if len(parts) > 1 else ""
    if not section or "不分节" in section:
        section = chapter
    section = re.sub(r"^第[一二三四五六七八九十]+节\s*", "", section).strip()
    section = re.sub(r"^第[一二三四五六七八九十]+章\s*", "", section).strip()

    # 按题型分组
    groups = {}
    cur_type = None
    blocks = re.split(r"\n---\n", txt)
    for blk in blocks:
        m = re.search(r"^##\s*([一二三四五六七八九十]+)、(.+)$", blk, re.M)
        if m:
            cur_type = TYPE_MAP.get("%s、%s" % (m.group(1), m.group(2).strip()))
        # 注意：题型标题与该题型第 1 题可能同处一个块，不能 continue
        q = parse_question(blk, cur_type)
        if q:
            groups.setdefault(cur_type, []).append(q)
    return chapter, section, groups


def parse_question(blk, qtype):
    lines = blk.strip().split("\n")
    # 题号行（可能前面有题型标题行）
    start = None
    for i, ln in enumerate(lines):
        m = re.match(r"^###\s*(\d+)\.", ln.strip())
        if m:
            start = i
            no = int(m.group(1))
            break
    if start is None:
        return None
    lines = lines[start:]
    # 题干：题号行之后，到第一个选项行/正确答案行之前
    stem_parts = []
    options = {}
    order = []
    table_rows = []
    answer = ""
    expl = ""
    i = 1
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if not s:
            i += 1
            continue
        mo = re.match(r"^-\s*([A-H])[.．、]\s*(.*)$", s)
        if mo:
            k = mo.group(1)
            order.append(k)
            options[k] = clean(mo.group(2))
            i += 1
            continue
        if s.startswith("|") and re.match(r"^\|\s*[A-H]\s*\|", s):
            cells = [clean(c) for c in s.strip().strip("|").split("|")]
            table_rows.append(cells)
            i += 1
            continue
        ma = re.match(r"^\*\*正确答案\*\*\s*[:：]\s*(.*)$", s)
        if ma:
            answer = clean(ma.group(1))
            i += 1
            continue
        me = re.match(r"^\*\*解析\*\*\s*[:：]\s*(.*)$", s)
        if me:
            expl = clean(me.group(1))
            i += 1
            continue
        if not answer and not expl:
            stem_parts.append(clean(s))
        i += 1

    stem = " ".join(stem_parts).strip()
    stem = re.sub(r"[（(]\s*[）)]\s*$", "", stem).strip()
    if stem and not stem.endswith(("？", "?", "。", ".", "）", ")")):
        stem += "（　　）"

    # 表格型选项
    if table_rows:
        opts = []
        for cells in table_rows:
            letter = cells[0]
            rest = [c for c in cells[1:]]
            opts.append((letter, "｜".join(rest)))
        order = [o[0] for o in opts]
        options = {o[0]: o[1] for o in opts}

    if not stem or not answer:
        return None

    # 答案解析
    ans_letters = re.findall(r"[A-H]", answer)
    idxs = [LETTERS.index(a) for a in ans_letters if a in LETTERS]

    if qtype == "judge":
        # 判断题：合成 正确/错误 两个选项
        is_true = answer in ("正确", "对", "√", "✓", "T", "true")
        opts = ["正确", "错误"]
        idxs = [0 if is_true else 1]
        qtype = "judge"
    else:
        opts = [options.get(k, "") for k in order]
        idxs = [j for j, k in enumerate(order) if k in ans_letters]

    if not idxs:
        return None

    q = {
        "no": no,
        "stem": stem,
        "options": opts,
        "answer": idxs[0],
        "type": qtype,
        "expl": expl,
    }
    if qtype == "multi":
        q["answers"] = idxs
    return q


def main():
    files = sorted(glob.glob(os.path.join(SRC, "第*.md")))
    questions = []
    categories = []
    chapter_order = 0
    seen_chapters = {}
    sec_counter = 0
    manifest = []

    for fp in files:
        chapter, section, groups = parse_md(fp)
        if not chapter:
            continue
        if chapter not in seen_chapters:
            sec_counter += 1
            chap_id = "cat-edu-c%d" % len(seen_chapters)
            seen_chapters[chapter] = chap_id
            categories.append({
                "id": chap_id, "name": chapter, "parentId": "cat-edu",
                "level": "section", "order": len(seen_chapters) - 1, "questionIds": [],
            })
        chap_id = seen_chapters[chapter]
        chap = [c for c in categories if c["id"] == chap_id][0]

        sec_id = "%s-s%d" % (chap_id, len([c for c in categories if c["parentId"] == chap_id]) + 1)
        qids = []
        for qtype in ("single", "multi", "judge"):
            for q in groups.get(qtype, []):
                cid = sec_id.replace("cat-edu-c", "c").replace("-s", "s")
                qid = "edu-%s-%s%d" % (cid, qtype[0], q["no"])
                manifest.append({"file": os.path.basename(fp), "chapter": chapter,
                                 "section": section, "type": qtype, "no": q["no"], "id": qid})
                item = {
                    "id": qid,
                    "category": section,
                    "difficulty": DIFF[qtype],
                    "question": q["stem"],
                    "options": q["options"],
                    "answer": q["answer"],
                    "type": q["type"],
                    "explanation": {
                        "brief": q["expl"],
                        "detailed": q["expl"],
                        "knowledge": "",
                        "tips": "",
                    },
                }
                if "answers" in q:
                    item["answers"] = q["answers"]
                questions.append(item)
                qids.append(qid)
        categories.append({
            "id": sec_id, "name": section, "parentId": chap_id,
            "level": "knowledge", "order": len([c for c in categories if c["parentId"] == chap_id]) - 1,
            "questionIds": qids,
        })
        chap["questionIds"].extend(qids)

    # 顶级：大标题
    categories.insert(0, {
        "id": "cat-edu", "name": TOP_TITLE, "parentId": None,
        "level": "chapter", "order": 0,
        "questionIds": [q["id"] for q in questions],
    })

    # ---------- 写出 TS ----------
    def ts(path, header, decl, data, imp=None, typ=None):
        body = json.dumps(data, ensure_ascii=False, indent=1)
        cast = " as unknown as %s[]" % typ if typ else ""
        with io.open(path, "w", encoding="utf-8") as f:
            f.write(header)
            if imp:
                f.write(imp)
            f.write("\nexport const %s = %s%s;\n" % (decl, body, cast))
        print("写出 %s (%d 条)" % (path, len(data)))

    q_header = ("// 本文件由 scripts/gen-edu-bank.py 自动生成，请勿手工修改。\n"
                "// 来源：《3500题》上册（教育学）Markdown 题库，共 %d 题。\n" % len(questions))
    ts(os.path.join(APP, "src/data/eduQuestions.ts"), q_header, "eduQuestions", questions,
       "import { Question } from '@/types';\n", "Question")

    c_header = ("// 本文件由 scripts/gen-edu-bank.py 自动生成，请勿手工修改。\n"
                "// 三级目录：大标题（章）→ 章（节）→ 节（知识点）。\n")
    ts(os.path.join(APP, "src/data/eduCategories.ts"), c_header, "eduCategories", categories,
       "import { CategoryHierarchy } from '@/types';\n", "CategoryHierarchy")

    # ---------- 知识点（每节一份考点清单） ----------
    kps = []
    for c in categories:
        if c["level"] != "knowledge":
            continue
        qs = [q for q in questions if q["id"] in set(c["questionIds"])]
        if not qs:
            continue
        lines = ["## %s · 考点清单\n" % c["name"],
                 "本节共 %d 题（单选 %d / 多选 %d / 判断 %d）。\n" % (
                     len(qs),
                     len([q for q in qs if q["type"] == "single"]),
                     len([q for q in qs if q["type"] == "multi"]),
                     len([q for q in qs if q["type"] == "judge"]))]
        for q in qs:
            brief = q["explanation"]["brief"]
            stem = re.sub(r"（　　）$", "", q["question"]).strip()
            lines.append("**%s** %s\n" % (stem[:46] + ("…" if len(stem) > 46 else ""), brief))
        kps.append({
            "id": "kp-%s" % c["id"].replace("cat-edu-c", "c").replace("-s", "s"),
            "category": TOP_TITLE,
            "title": c["name"],
            "content": "\n".join(lines),
            "summary": "%s：共 %d 题" % (c["name"], len(qs)),
            "relatedQuestionIds": c["questionIds"],
            "importance": 3,
            "isCustom": False,
            "createdAt": "2026-10-28",
        })
    k_header = ("// 本文件由 scripts/gen-edu-bank.py 自动生成，请勿手工修改。\n"
                "// 每节一份考点清单，可用于「知识点」页面复习。\n")
    ts(os.path.join(APP, "src/data/eduKnowledge.ts"), k_header, "eduKnowledgePoints", kps,
       "import { KnowledgePoint } from '@/types';\n", "KnowledgePoint")

    # 清单（供校验用）
    io.open(r"E:\deepseek\题库资料\3500题上册\_edu_manifest.json", "w", encoding="utf-8").write(
        json.dumps(manifest, ensure_ascii=False, indent=1))

    # ---------- 统计 ----------
    from collections import Counter
    print("\n=== 生成统计 ===")
    print("章节（大标题→章）：%d 个大标题 / %d 个章 / %d 个节" % (
        len([c for c in categories if c["level"] == "chapter"]),
        len([c for c in categories if c["level"] == "section"]),
        len([c for c in categories if c["level"] == "knowledge"])))
    print("题目总数：%d" % len(questions))
    print("题型分布：%s" % dict(Counter(q["type"] for q in questions)))
    print("知识点：%d 份" % len(kps))


if __name__ == "__main__":
    main()
