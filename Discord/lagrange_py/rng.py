import sys
import json
import random
x, y = input().split(" ")
x = int(x)
y = int(y)
print(json.dumps(str(random.randint(x, y))))
