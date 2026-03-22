import json

with open("src/asset/figma.json") as f:
    data = json.load(f)

doc = data.get("document", data)
canvas = doc["children"][0]
page = canvas["children"][0]

for i, sec in enumerate(page["children"]):
    fills = sec.get("fills", [])
    bg_info = "no fill"
    for fl in fills:
        if fl.get("type") == "SOLID" and fl.get("visible", True):
            c = fl.get("color", {})
            bg_info = "r={:.2f} g={:.2f} b={:.2f}".format(c.get("r", 0), c.get("g", 0), c.get("b", 0))

    rect_info = ""
    for ch in sec.get("children", []):
        if ch.get("type") == "RECTANGLE":
            nm = ch.get("name", "").lower()
            for fl in ch.get("fills", []):
                if fl.get("type") == "SOLID" and fl.get("visible", True):
                    col = fl.get("color", {})
                    rect_info += " | rect '{}': r={:.2f} g={:.2f} b={:.2f}".format(
                        ch["name"], col.get("r", 0), col.get("g", 0), col.get("b", 0)
                    )

    print("[{}] {} ({}) - {}{}".format(i, sec["name"], sec["type"], bg_info, rect_info))
