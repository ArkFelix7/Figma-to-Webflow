import json

with open("src/asset/figma.json") as f:
    data = json.load(f)

doc = data.get("document", data)
canvas = doc["children"][0]
page = canvas["children"][0]

def find_rects(node, parent_w=0, parent_h=0, depth=0):
    if node.get("type") == "RECTANGLE":
        for fl in node.get("fills", []):
            if fl.get("type") == "SOLID" and fl.get("visible", True):
                c = fl.get("color", {})
                box = node.get("absoluteBoundingBox", {})
                w = box.get("width", 0)
                h = box.get("height", 0)
                ratio_w = w / parent_w if parent_w > 0 else 0
                ratio_h = h / parent_h if parent_h > 0 else 0
                is_bg = ratio_w > 0.9 and ratio_h > 0.9
                print("{}RECT '{}' ({:.0f}x{:.0f}) ratio={:.2f}/{:.2f} bg={}: r={:.2f} g={:.2f} b={:.2f}".format(
                    "  " * depth, node["name"], w, h, ratio_w, ratio_h, is_bg,
                    c.get("r", 0), c.get("g", 0), c.get("b", 0)))
    box = node.get("absoluteBoundingBox", {})
    nw = box.get("width", 0)
    nh = box.get("height", 0)
    for ch in node.get("children", []):
        if depth < 2:
            find_rects(ch, nw, nh, depth + 1)

for i in [3, 8]:  # Features sections
    sec = page["children"][i]
    box = sec.get("absoluteBoundingBox", {})
    print("[{}] {} ({}) - {:.0f}x{:.0f}".format(i, sec["name"], sec["type"], box.get("width", 0), box.get("height", 0)))
    find_rects(sec)
    print()
