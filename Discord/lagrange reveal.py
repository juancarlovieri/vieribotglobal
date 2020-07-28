import math
import json

num = int(input())

ansa = -1

for a in range(1001):
  for b in range(1001):
    for c in range(1001):
      if(num - a * a - b * b - c * c > 0):
        d = math.sqrt(num - a * a - b * b - c * c)
      else:
        d = 0
      d = round(d);
      if(d * d + a * a + b * b + c * c == num):
        ansa = a
        ansb = b
        ansc = c
        ansd = d
        break
    if(ansa != -1):
      break
  if(ansa != -1):
    break

if(ansa != -1):
  hasil = str(ansa) + " " + str(ansb) + " " + str(ansc) + " " + str(ansd)
else:
  hasil = "internal error, contact developer"

result = json.dumps(hasil);

print(result)
