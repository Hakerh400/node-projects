not = a => !a
add = a => b => a + b
emp = a => []
pro = a => b => a[b]
num = a => +a
arr = a => [a]
met = a => b => c => a[b](c)

str = a => add(a)(emp())

tru = a => not(fal())
fal = a => not(emp())
und = a => pro(emp())(emp())
nan = a => num(arr(fal()))

zer = a => num(fal())
one = a => num(tru())
two = a => add(one())(one())
thr = a => add(two())(one())
fou = a => add(thr())(one())
fiv = a => add(fou())(one())
six = a => add(fiv())(one())
sev = a => add(six())(one())
eig = a => add(sev())(one())
nin = a => add(eig())(one())
ten = a => num(add(str(one()))(zer()))
ele = a => add(ten())(one())
twe = a => num(add(str(two()))(zer()))
tw1 = a => add(twe())(one())

chf = a => pro(str(fal()))(zer())
chi = a => pro(add(arr(fal()))(und()))(ten())
chl = a => pro(str(fal()))(two())
chc = a => pro(str(fun()))(thr())
cho = a => pro(add(tru())(fun()))(ten())
chn = a => pro(str(und()))(one())
chs = a => pro(str(fal()))(thr())
cht = a => pro(str(tru()))(zer())
chr = a => pro(str(tru()))(one())
chu = a => pro(str(und()))(zer())
che = a => pro(str(tru()))(thr())
cha = a => pro(str(fal()))(one())
chp = a => pro(met(num(add(str(tw1()))(one())))(tos(stn()))(add(str(thr()))(one())))(one())
chm = a => pro(str(Num()))(ele())
chb = a => sfc(six)(two)
chd = a => sfc(six)(fou)
chh = a => sfc(six)(eig)

spa = a => pro(add(nan())(fun()))(ele())
per = a => pro(esf(fun()))(tw1())
til = a => sfc(sev)(che)

fil = a => add(add(chf())(chi()))(add(chl())(chl()))
co1 = a => add(add(add(chc())(cho()))(chn()))(add(add(chs())(cht()))(chr()))
co2 = a => add(add(add(chu())(chc()))(cht()))(add(cho())(chr()))
con = a => add(co1())(co2())
ret = a => add(add(add(chr())(che()))(cht()))(add(add(chu())(chr()))(chn()))
rts = a => add(add(ret())(spa()))(a)
frt = a => nfu(rts(a))()
esc = a => add(add(add(che())(chs()))(chc()))(add(add(cha())(chp()))(che()))
une = a => add(add(chu())(chn()))(esc())
nam = a => add(add(chn())(cha()))(add(chm())(che()))
stn = a => pro(Str())(nam())
tos = a => add(add(cht())(cho()))(a)
thi = a => add(add(cht())(chh()))(add(chi())(chs()))

ctr = a => pro(a)(con())

Num = a => ctr(num(emp()))
Str = a => ctr(add(emp())(emp()))
Fun = a => ctr(fun())

fun = a => pro(emp())(fil())
esf = a => frt(esc())(a)
unf = a => frt(une())(a)
nfu = a => Fun()(a)
eva = a => nfu(rts(a))()
ths = a => eva(thi())

cod = a => unf(add(per())(a))
sfc = a => b => cod(add(str(a()))(b()))

uop = a => b => eval(add(a)(b))
bop = a => b => c => eval(add(add(b)(a))(c))

neg = a => uop(til())(a)
mod = a => bop(per())(a)

mai = a => ths()