import sys
import json
from math import sqrt
from random import randrange as random

def lag(n):
    if(n==0):
        print("0 0 0 0")
        return
    mult=1;
    while(n%4==0):
        mult*=2
        n//=4
    i=int(sqrt(n))
    while(True):
        x=n-i*i
        while(x>0 and x%4==0):x//=4
        if(x>=0 and x%8!=7):
            break
        i-=1
    n-=i*i
    for j in range(n+1):
        for k in range(j+1):
            for l in range(k+1):
                if(j*j+k*k+l*l==n):
                    print(json.dumps(str(mult * l) + " " + str(mult * k)+" "+str(mult*j)+" "+str(mult*i)))
                    return 1
    return 0


n = int(input())
if(lag(n) == 0):
    print(json.dumps("internal error, contact developer"))
