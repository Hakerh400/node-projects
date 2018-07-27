**Functional()** is a turing-complete programming language based on the functional programming paradigm.

## Syntax

Source code is represented in the ASCII encoding and consists of characters `(`, `)`, `,`, whitespace characters and identifiers. Example:

```
abc(d(e, e1), f, g()),
h(&&(^), $(@, ~))(abc)
```

Everything that is not `(`, `)`, `,` or whitespace (that matches regular expression `\s+`) is considered as an identifier. Thus, the identifiers in the above example are `abc`, `d`, `e`, `e1`, `f`, `g`, `h`, `&&`, `^`, `$`, `@`, `~`.

Each program represents a *List* of zero or more *CallChains*. A *CallChain* is an identifier followed by zero or more *Lists* surrounded by a pair of parentheses. Elements of a *List* are separated by `,`.

The above example has two main *CallChains*: `abc(d(e, e1), f, g())` and `h(&&(^), $(@, ~))(abc)`. The first *CallChain* consists of identifier `abc` and *List* `(d(e, e1), f, g())`, while the second *CallChain* consists of identifier `h` and two *Lists*: `(&&(^), $(@, ~))` and `(abc)`.

## Evaluation

Each identifier has a function associated with it. When program starts, the main *List* starts to evaluate.

*List* evaluates in the following way:

1. If the *List* is empty, return the function associated with the 0-th global identifier
2. Otherwise evaluate all *List*'s *CallChains*

*CallChain* evaluates in the following way:

1. If the *CallChain* has no *Lists*, return the value of the *CallChain*'s identifier
2. Otherwise do the following
    - 2.1. Evaluate all *CallChain*'s *Lists*
    - 2.2. Call the function associated with the first *List* as arguments
    - 2.3. Remove the first *List*
    - 2.4. Replace the identifier with the result of the call
    - 2.5. If there are no more *List*, return the value of the identifier
    - 2.6. Otherwise go to 2.2.

There are some exceptions to these rules.

## Functions

*Functional()* has 6 native functions. Native functions have no reserved identifiers, but their values are assigned to the first 6 identifiers (reading from left to right) that appear in the source code. If the source code has less identifiers that the number of native functions, some native functions will not be assigned to any identifier.

The native functions are:

1. Zero (0)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes two arguments, returns the second one.

2. One (1)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes two arguments, returns the first one.

3. Equality

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes two arguments, returns 1 if they are the same, otherwise returns 0.

4. Assign

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes two arguments, if the first one is not an identifier returns 0,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; otherwise assigns the second argument to the identifier from the first argument.

5. Variable

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes two arguments, if the first one is not an identifier returns 0,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; otherwise creates a new variable in the most inner scope with name equals to the identifier<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; from the first argument and assigns the second argument to that variable.

6. New function

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes zero or more arguments, if any of the arguments is not an identifier returns 0,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; otherwise returns a *FunctionTemplate*.

*FunctionTemplate* is a function which has an internal list of formal arguments. When called, it doesn't evaluate it's arguments, but stores the argument list as its body and returns a new *UserlandFunction*.

*UserlandFunction* takes zero or more arguments and evaluates them. Then each evaluated argument is assigned to the corresponding internal formal argument and the function body is evaluated in the new scope based on the formal and actual arguments.

## IO Interface

*Functional()* provides a way of adding native functions before running a program. This implementation provides 3 new functions for IO interface:

1. Read

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes no arguments, returns the next bit (0 or 1) from the input stream

2. Write

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes one argument, outputs the bit to the output stream and returns 0.

3. Eof

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Takes no arguments, returns 1 if there are no more bits in the input stream,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; otherwise returns 0.

These functions are assigned to the 7th, 8th and 9th identifier from the source code.

The function *Write* considers the 0th global identifier as bit 0 and anything other as bit 1. Both *Read* and *Write* process bits from input/output starting at the lowest bit of the first byte to the highest bit of the first byte, then the second byte, end so on. Calling *Read* after all input is read returns 0.

If the program is terminated, but the output has no enough bits to form a byte, the output will be padded with 0-bits in order to complete the byte.

# Examples

We assume the standard IO interface implementation is used. The first 9 identifiers that appear in the source code will be native functions. Accessing undefined identifier returns 0 (actually the 0th global identifier, which may be overriden though).

In these examples we will use identifiers `0`, `1`, `==`, `=`, `var`, `[]`, `read`, `write`, `eof` respectively. Note that there are nothing special about `==`, `=`, `[]`, they are valid identifiers.

### Example 1: Printing letter "A"

```
0, 1,
==, =, var, [],
read, write, eof,

write(1), write(0), write(0), write(0),
write(0), write(0), write(1), write(0)
```

The ASCII code of letter "A" is 65, which is 1000001 in binary. Because the *Read* and *Write* functions process bits from lowest to highest, we need to reverse the bits. The last `write(0)` may be omitted because of padding incomplete bytes with 0-bits.

**Note:** In the following examples the header (first 9 identifiers) are omitted for simplicity, but they are required if you want to run the actual code.

### Example 2: Cat

```
var(not, [](a)(==(a, 0))),
var(bool, [](a)(not(not(a)))),

var(while, [](cond, func)(
  var(temp, bool(cond()))(while)(cond, func, temp(func)())
)),

while([]()(not(eof())), []()(
  write(read())
))
```

There are several things demontrated in this example.

Code `[](a)(==(a, 0))` creates a *UserlandFunction* which takes argument `a` and returns the result of comparison `a` with `0`. In other words, it returns `1` iff `a` is `0`, and `0` otherwise.

Code `var(not, [](a)(==(a, 0)))` assigns the newly created *UserlandFunction* to the global identifier `not`.

The second line does a similar thing: creates a function which takes argument `a` and returns `not(not(a))` (converts it to boolean).

Now, the interesting part: *while* loop. The *while* loop is just a function which takes two arguments: `cond` and `func`. While the result of calling `cond` returns a truthy value, call `func`. It is achieved by recursively calling `while` function. We will not describe here in details how and why it works.

It is possible to spin in a *while* loop forever, without causing a stack overflow. That is done by replacing caller's stack frame with the stack frame of the callee's last *CallChain*.

Finally, we call our `while` function with two *UserlandFunctions*. The first one returns `1` if `eof` returns `0`. The second one reads a bit from the input and writes the bit to the output. In other words: while `eof()` is false, read a bit and output it.

### Example 3: Closures

In *functional()* it is possible to create a closure. A closure is created either by returning a *UserlandFunction* (defined in the local scope), or passing it as an argument.

```
var(func, [](a)(
  []()(a)
)),

var(closure, func(1)),
write(closure()),

write(0), write(0), write(0),
write(1), write(1)
```

Function `func` takes argument `a` and returns a function that takes no arguments and returns `a`.

In this example, we are passing `1` as the argument to `func`, and then obtaining it again by calling `closure()`. Finally, we print the number as ASCII character "1". If you replace `func(1)` with `func(0)` it will print character "0".

Closures open a lot of possibilities: implementing arrays, matrices, linked lists, multidimensional tensors, etc.

### Example 4: Classes

```
var(.get, []()()),
var(.set, []()()),

var(Class, [](a)(
  var(get, []()(a)),
  var(set, [](b)(=(a, b))),

  [](method)(
    ==(method, .get)(get,
    ==(method, .set)(set
    ))
  )
)),

var(obj, Class(0)),

write(obj .get()),
write(0), write(0), write(0),
write(1), write(1), write(0), write(0),

obj .set(1),

write(obj .get()),
write(0), write(0), write(0),
write(1), write(1)
```

Here we have class `Class` which a constructor and two methods. The constructor takes one argument and stores it as a private member `a`.

The first method is `get`. It takes no arguments and returns the value of `a`. Method `set` takes an argument (here `b`) and assigns the value of `b` to `a`.

We used two tricks here. The first one is the fact that every *UserlandFunction* which is created by a separate call to the 6th native function is different, so we can use it like an enum.

The second trick is syntactical: if two identifiers appear one after another (here `.get` and `.set` appear after `.obj`) they are interpreted like a *CallChain*. Note that `.get` and `.set` are just identifiers, so if you remove the space from `obj .get()` it wont work as expected. For example, `a .b .c` is equivalent to `a(.b)(.c)`, but not `a.b.c`.

This code prints "01".

# How to run

Navigate to the `example` directory and run the following command:

```
node example.js -src src.txt -i input.txt -o output.txt
```

The `src.txt` file contains a simple *function()* program that implements BigInt addition. It reads two integers from the `input.txt` separated by a space, adds them together and saves the resulting number to `output.txt`.