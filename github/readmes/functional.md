**Functional()** is an esoteric Turing complete programming language. The goal of creating *Functional()* is to design and implement a programming language that satisfies the following conditions:

1. **It is Turing complete.** A *Functional()* program can do anything that the Turing machine can do.
2. **It is 100% in functional programming paradigm.** *Functional()* doesn't natively know about concepts such as numbers (bytes, integers, floating-points, etc), arrays, objects, sets, hash tables, classes, `for` and `while` loops, threads, memory, instructions, and so on. Everything it knows are functions and everything it does is call functions.
3. **It doesn't have syntax errors.** Any string is a valid *Functional()* program.
4. **It doesn't provide any non-elementary native function.** There are two types of functions: native and user-defined. The set of native functions are the smallest possible. It doesn't contain any function that possibly could be defined by a user.
5. **There are no syntactical differences between function definition and function call.** This is something that is not seen in too many languages (if any language implements this concept at all). In other words, without running the program, it is impossible to tell if some function call is a new function definition, or just a regular function call.
6. **It has variables.** A variable in *Functional()* is just a function that is assigned to an identifier. It may be global, or defined inside a function. Variables are evaluated at runtime. There are no constants, even native functions can be modified (actually, a function itself can't be modified, but the identifier that is associated with it).
7. **It has closures.** A function may be defined inside another function. Then it can be returned, or passed to another function. That is how a closure is created.
8. **It is 100% deterministic.** Every *Functional()* program that eventually halts, given the same input, it always produces the same output. Program execution doesn't depend on current time, operating system, files on disk, or similar. Also, there are no way to generate a random output for constant input.
9. **While there is no native support for non-elementary concepts, it's relatively easy to implement them.** *Functional()* is not like an assembler. Given an assembler that works only with bits (0 and 1), it's not so easy to implement some highly abstract concepts like Fourier transform, red-black trees, graph traversal algorithm, etc. In contrast to that, *Functional()* provides an easy way for implementing more abstract concepts using previously defined less abstract concepts. See the examples section for details.
10. **There are no memory limits.** *Functional()* has no limits regarding time and memory. While many programming languages also don't constrain execution time by default, they constrain memory. However, *Functional()* doesn't do that. Both heap and stack are of unlimited size. The stack is simulated using heap objects, so there is no recursion limit. However, if the heap is full and no more RAM memory can be allocated, *Functional()* starts to use physical disk as a memory extension (it can be configured in options). When there is no more space on the disk, it can optionally use a remote server for storing data (it also can be configured).
11. **It is highly optimized.** Calling a function is an expensive action. According to the fact that everything *Functional()* knows is to call functions, a lot of optimizations are used. Optimizations should not affect the output by any means, so they are optional, but may be very helpful. There is only one optimization that may be considered as mandatory: infinite recursion. In some special cases, a recursion calls can be optimized in such a way that the stack (nor heap) isn't growing at all. It is useful for implementing `while` loops (see examples below). That optimization is achieved by exploiting the way *Functional()* is designed and safely replacing caller's stack frame with callee's stack frame.
12. **It is portable.** *Functional()* programs are portable, not only in the sense of compiling and executing the code on different machines, operating systems or architectures, but also program execution itself is portable. A program can be paused at any time, its virtual memory saved to the disk, and then loaded later. It is impossible for the program to detect it.
13. **A function may be called with different number of arguemnts than it takes by default.**
14. **A user-defined function can't detect the number of arguments it has been called with.**
15. **A user-defined function can't check if a given variable has been defined or not.**
16. **There are no destructors.** Garbage collector cleans up the memory implicitly.
17. **Byte is not a native concept.** *Functional()* doesn't know what a byte (array of 8 consecutive bits) is. Source code, input and output are strings of bits, not bytes. For example, source code can be 11 bits long, input 5 bits and output 17 bits.
18. **There are no native syntax rules.** The syntax is defined in the source code itself, which gives users the full freedom to adjust how the grammar will look like and how the program will be parsed.

Some of these features are implemented in v1.x, some are planned for v2.x.

# Examples

For the actual code, see the `examples` directory. Here we are focusing on the abstract approaches for implementing some concepts, rather on writing the code. All concepts can be implemented using native functions and/or previously implemented concepts. Native functions are the following:

1. Two functions that represent bits (0 and 1)
2. Function comparator - returns a bit based on the equality of its arguments
3. Variable declaration and/or modification
4. IO functions (read input bit, write bit to output, check if there are more bits in the input)
5. Assemble other functions into a new (user-defined) function

The concepts described in the following examples **are not natively supported** by *Functional()*, they need to be implemented as user-defined functions.

### Bits

While bits are native functions, what they do is a developer's decision. Probably the most useful action a bit can do as a function is:

1. Bit 0 - takes two arguments, returns the second one
2. Bit 1 - takes two arguments, returns the first one

### If statement

Using bits as defined above, we can define function `if` that takes three arguments. If the first one is `0` (use comparator to check that), call the second one, otherwise call the third one.

### While loop

The `while` loop is a bit harder. It can be implemented as a function that takes two arguments. While the result of calling the first argument is truthy (different from `0`) call the second argument. It may be achieved by defining a function that does the following:

- Call the first argument
- Use `if` on that result
  - If the result if truthy, call the second argument and call the `while` again with the same arguments
  - Otherwise return

### Ordered pair

Probably the most useful and basic structure is ordered pair. It is a pair of two values that may be accessed or modified at runtime. This concept may be implemented like following:

- Implement pair as a function that takes two arguments (initial values)
- Then save the arguments in local variables (for example, call them A and B respectively)
- Finally, return a function (and thus create a closure) that does the following:
  - Takes two or three arguments.
  - If the first argument is 0, return A or B based on the truthiness of the second argument (for example 0 gives A and 1 gives B)
  - If the first argument is 1, assign the third argument to the A or B based on the truthiness of the second argument

### Byte

Byte is a pair of pairs of pairs of bits. Reading and modifying specific bits can be achieved similarly to the pair implementation.

### Linked list

Another very useful structure. An element of a linked list is a pair that has the actual value as the first element and the next list's element as the second element. If there are no more list elements, 0 can be used (similarly to `nullptr` in C++, since 0 is the only falsy value). An element of a double linked list is similar, but the second element of element's pair is a pair of the previous and the next list's element.

### Tree

Similar to linked list. Here all elements are similar to elements of double linked list, since two pointers are needed (for the left and the right child nodes). Actually, pointers in *Functional()* are not like in C++, they are more like references in Python or JavaScript.

### Class

Despite the fact that *Functional()* is strictly functioncal, other paradigms may be introduced relatively easily, especially the object-oriented paradigm. Classes may look like this:

- A class of some kind is a function that takes arguments (that would be passed to constructor in C++)
- Do some initialization that belongs to the constructor. For exmaple, define local variables (private attributes), maybe achieve some side-effects, call other functions...
- Define local functions (public and private methods)
- Return a function (`this` in C++) that does the following:
  - Takes a method name as the only argument
  - Compares that name to unique global identifiers and find the one corresponding to the calling method (see note below)
  - Return the found local method

Unique global identifiers are empty functions (assembled using no other functions, so they are empty, but every such function is different according to the native comparator). They can be used to implement enums, or to distinguish between method names, as explained above.

Also, *"Takes a method name as the only argument"* doesn't mean that *Functional()* sees method names as strings. They are just identifiers and there are constant number of identifiers in each *Functional()* program.

### Integer

A 16-bit, 32-bit or 64-bit integer (or even larger one) is a complete tree of bytes.

### Array

May be implemented using a lot of different methods. The most common are lists and trees.

### BigInt

Array of bytes.

### String

Array of bytes, but provides different methods than BigInt.

### Vector, Matrix, Tensor of any kind

Array for vectors, nested arrays for others.

### Integer comparisons

By iterating over bits, operations like `==`, `>`, `<`, `>=`, `<=` can be easily implemented.

### Integer operations

Simple solution:

- `and`, `or`, `xor`, `xnor`, and similar - iterate over the bits and perform the required operation
- `shift`, `rotate` - similar, but needs an extra variable for memorizing some bits
- Addition and subtraction - similar to shifting and rotating
- Multiplication - iterative addition
- Division - iteratively try to multiply denominator by positive integers until the result is larger that the numerator
- Exponentiation - iterative multiplication

Don't be scared of the huge amout of nested iterations described here. There is no need to worry about performances, since the optimizer may replace any of these operations with just a single processor instruction. For example, multiplying two 64-bit integers requires `64 * 64` function calls in the wors case, but the optimizer may replace it with just a single `mul rax, rbx, rcx` instruction, increasing the speed thousands of times. Also, the otpimizer may replace bytes and integers with literal processor integers and use them instead, avoiding the closures completely.

### Non-inetger number

A non-integer may be implemented as the IEEE floating single-precision or double-precision number. It consists of sign, mantissa and exponent. Implementing operatins on them would be easy if all of the previous concepts are already implemented.

### Math operations

Operations like trigonometric functions, logarithms, exponentiation (including non-integer exponents), and similar can be achieved using Maclaurin series, which reduces the problem to basic floating-point operations.

### Constants like PI, E, Euler–Mascheroni constant and others

Each of these constants can be either defined as a constant of bounded precision, or evaluated at runtime to an arbitrary presion using some algorithm.

### Other ideas

We explained how to implement some basic concepts, functions and data-structures. With that, everything other is relatively easy. One may implement JavaScript interpreter using all of that definitions, since JavaScript code can be converted to *Functional()* code and JavaScript built-ins (like Math, Object, Array, String, etc) can be implemented using above concepts. Also, it's not so hard to create a *Functional()* interpreter in *Functional()*.

Other things like hash tables, common hash functions, virtual memory, thread simulator, operating system and similar concepts would be interesting to implement. Given that *Functional()* has the minimal number of native functions and knows only about bits (0 and 1, which are also functions), the effort needed to implement highly abstract concepts from nothing is probably minimal among other languages that provide *minimal* native functionalities (like Turing machine, Brainfuck, 8086 assembler, etc). That is also the goal of *Functional()* as a programming language.

### Quine

A quine (non-empty program which takes no input and produces a copy of its own source code as its only output) should be achievable, but we couldn't manage to construct one.