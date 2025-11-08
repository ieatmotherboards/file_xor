from diff_match_patch import diff_match_patch

def compute_diff(text1: str, text2: str):
    dmp = diff_match_patch()
    diffs = dmp.diff_main(text1, text2)
    dmp.diff_cleanupSemantic(diffs)

    blocks = []
    idx1 = 0
    idx2 = 0
    block_id = 0

    for op, data in diffs:
        length = len(data)

        if op == dmp.DIFF_EQUAL:
            idx1 += length
            idx2 += length
            continue

        block = {
            "id": f"block_{block_id}",
            "kind": "insert" if op == dmp.DIFF_INSERT else "delete" if op == dmp.DIFF_DELETE else "replace",
            "a": {
                "start": idx1,
                "end": idx1 + (length if op != dmp.DIFF_INSERT else 0),
                "text": data if op != dmp.DIFF_INSERT else ""
            },
            "b": {
                "start": idx2,
                "end": idx2 + (length if op != dmp.DIFF_DELETE else 0),
                "text": data if op != dmp.DIFF_DELETE else ""
            }
        }

        if op != dmp.DIFF_INSERT:
            idx1 += length
        if op != dmp.DIFF_DELETE:
            idx2 += length

        blocks.append(block)
        block_id += 1

    return {"blocks": blocks}
