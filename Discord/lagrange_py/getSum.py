import sys
import json
a, b, c, d = input().split(" ");
a = int(a)
b = int(b)
c = int(c)
d = int(d)
print(json.dumps(str(a * a + b * b + c * c + d * d)))