import sys
import json
from math import isqrt
from random import randrange as random

def lag(n):
    if(n==0):
        print(json.dumps("0 0 0 0"))
        return 1
    r=0
    while(n%2==0):
        r+=1
        n//=2
    i=isqrt(n)
    if(n%4==1):
        if(i%2==1):
            i-=1
    else:
        if(i%2==0):
            i-=1
    n-=i*i
    sqrt2=isqrt(n)
    for j in reversed(range(sqrt2+1)):
        sqrt3=isqrt(n-j*j)
        for k in reversed(range(sqrt3-100, sqrt3+1)):
            l=isqrt(n-j*j-k*k)
            if(k<l):
                break
            if(j*j+k*k+l*l==n):
                if(r%2==1):
                    if(i>j):
                        i, j=j, i
                    i, j=j-i, i+j
                    if(k>l):
                        k, l=l, k
                    k, l=l-k, k+l
                i<<=r//2
                j<<=r//2
                k<<=r//2
                l<<=r//2
                print(json.dumps(str(l) + " " + str(k) + " " + str(j) + " " + str(i)));
                return 1
    return 0


n = int(input())
if(lag(n) == 0):
    print(json.dumps("internal error, contact developer"))