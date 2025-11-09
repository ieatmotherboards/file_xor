from difflib import SequenceMatcher

def compute_diff(text1: str, text2: str):
    # Split into lines for semantic comparison
    lines1 = text1.splitlines(keepends=True)
    lines2 = text2.splitlines(keepends=True)

    matcher = SequenceMatcher(None, lines1, lines2)
    blocks = []
    block_id = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        # Skip identical regions
        if tag == "equal":
            continue

        # Compute the changed sections
        a_text = "".join(lines1[i1:i2])
        b_text = "".join(lines2[j1:j2])

        # Skip purely whitespace or empty changes
        if not a_text.strip() and not b_text.strip():
            continue

        blocks.append({
            "id": f"block_{block_id}",
            "kind": tag,  # 'replace', 'delete', 'insert'
            "a": {
                "start": sum(len(x) for x in lines1[:i1]),
                "end": sum(len(x) for x in lines1[:i2]),
                "text": a_text,
            },
            "b": {
                "start": sum(len(x) for x in lines2[:j1]),
                "end": sum(len(x) for x in lines2[:j2]),
                "text": b_text,
            },
        })
        block_id += 1

    return {"blocks": blocks}
