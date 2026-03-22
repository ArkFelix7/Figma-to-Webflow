#!/bin/bash
echo "=== LUMOS COMPLIANCE CHECK ==="

echo -n "1. No inline styles: "
test $(grep -c 'style="' output.html) -eq 0 && echo "PASS" || echo "FAIL"

echo -n "2. No @media: "
grep -q '@media' output.html && echo "FAIL" || echo "PASS"

echo -n "3. No px values: "
grep -oE '[1-9][0-9]*px' output.html | grep -v 'placehold' > /dev/null 2>&1 && echo "FAIL" || echo "PASS"

echo -n "4. No overflow:hidden: "
grep -q 'overflow: hidden' output.html && echo "FAIL" || echo "PASS"

echo -n "5. No bare 1fr: "
grep '1fr' output.html | grep -v 'minmax(0, 1fr)' > /dev/null 2>&1 && echo "FAIL" || echo "PASS"

echo -n "6. No background shorthand: "
grep -E '^\s+background:' output.html > /dev/null 2>&1 && echo "FAIL" || echo "PASS"

echo -n "7. Uses u-section: "
grep -q 'u-section' output.html && echo "PASS" || echo "FAIL"

echo -n "8. Uses u-container: "
grep -q 'u-container' output.html && echo "PASS" || echo "FAIL"

echo -n "9. Uses u-theme: "
grep -q 'u-theme-' output.html && echo "PASS" || echo "FAIL"

echo -n "10. Uses u-text-style: "
grep -q 'u-text-style-' output.html && echo "PASS" || echo "FAIL"

echo -n "11. Uses color-mix: "
grep -q 'color-mix' output.html && echo "PASS" || echo "FAIL"

echo -n "12. Uses spacing vars: "
grep -q '_spacing---space' output.html && echo "PASS" || echo "FAIL"

echo -n "13. Uses minmax(0, 1fr): "
grep -q 'minmax(0, 1fr)' output.html && echo "PASS" || echo "FAIL"

echo -n "14. Semantic nav tag: "
grep -q '<nav' output.html && echo "PASS" || echo "FAIL"

echo -n "15. Semantic footer tag: "
grep -q '<footer' output.html && echo "PASS" || echo "FAIL"

echo -n "16. Uses rem: "
grep -q 'rem' output.html && echo "PASS" || echo "FAIL"

echo -n "17. Button data-trigger: "
grep -q 'data-trigger' output.html && echo "PASS" || echo "FAIL"

echo -n "18. Uses trigger vars: "
grep -q '_trigger---on' output.html && echo "PASS" || echo "FAIL"

echo -n "19. Section>container>layout: "
grep -A2 'u-section' output.html | grep -q 'u-container' && echo "PASS" || echo "FAIL"

echo -n "20. Uses border-width var: "
grep -q 'border-width--main' output.html && echo "PASS" || echo "FAIL"

echo ""
echo "=== STATS ==="
echo "Total sections: $(grep -c 'u-section' output.html)"
echo "Total CSS vars: $(grep -c 'var(--' output.html)"
echo "Total text styles: $(grep -c 'u-text-style' output.html)"
echo "Total buttons: $(grep -c 'data-trigger' output.html)"
echo "File size: $(wc -c < output.html) bytes"
echo "Line count: $(wc -l < output.html)"
