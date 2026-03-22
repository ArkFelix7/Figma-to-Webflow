import json

with open("src/asset/figma.json") as f:
    data = json.load(f)

doc = data.get("document", data)
canvas = doc["children"][0]
page = canvas["children"][0]

# Testimonials is index 2 (from bottom)
test = page["children"][2]
print("Testimonials section:", test["name"], test["type"])
print("  layoutMode:", test.get("layoutMode", "N/A"))
for i, c in enumerate(test.get("children", [])):
    box = c.get("absoluteBoundingBox", {})
    print("  [{}] {} ({}) - pos={:.0f},{:.0f} size={:.0f}x{:.0f} layout={}".format(
        i, c["name"], c["type"],
        box.get("x", 0), box.get("y", 0), box.get("width", 0), box.get("height", 0),
        c.get("layoutMode", "N/A")
    ))
    for j, gc in enumerate(c.get("children", [])):
        gbox = gc.get("absoluteBoundingBox", {})
        print("    [{}] {} ({}) - pos={:.0f},{:.0f} size={:.0f}x{:.0f} layout={}".format(
            j, gc["name"], gc["type"],
            gbox.get("x", 0), gbox.get("y", 0), gbox.get("width", 0), gbox.get("height", 0),
            gc.get("layoutMode", "N/A")
        ))

print()
# Also check footer cols
footer = page["children"][0]
for i, c in enumerate(footer.get("children", [])):
    box = c.get("absoluteBoundingBox", {})
    print("Footer [{}] {} ({}) - pos={:.0f},{:.0f} size={:.0f}x{:.0f} layout={}".format(
        i, c["name"], c["type"],
        box.get("x", 0), box.get("y", 0), box.get("width", 0), box.get("height", 0),
        c.get("layoutMode", "N/A")
    ))
