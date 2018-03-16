# SourceCode

Consists of the following:

1. ClassDeclaration
2. WhiteSpace

If there is no `ClassDeclaration`, throw `SyntaxError`: *"Source code must contain at least one class"*

# ClassDeclaration

```
ClassDeclaration := "class" WhiteSpace ClassName1
                    [WhiteSpace "extends" WhiteSpace ClassName2]
                    [WhiteSpace] "{" [WhiteSpace] ClassBody [WhiteSpace] "}"
```

**Note 1:** Square brackets represent optional content.

If `ClassName1` is one of `NativeClassNames`, throw `SyntaxError`: *"Class name cannot be one of native class names"*
If some previous `ClassDeclaration` has the same class name as `ClassName1`, throw `SyntaxError`: *"Class with that name has already been defined"*
If `ClassName2` is neither one of `NativeClassNames` and no `ClassDeclaration` in the `SourceCode` has that class name, throw `SyntaxError`: *"The base class is undefined"*

**Note 2:** Omitting `extends` part is semantically equivalent to *"extends Object"*

# ClassBody

# WhiteSpace

`NewLine`, `Comment`, or one of the following ascii characters:

1. 0x32 (space)
2. 0x09 (tab)

# NewLine

Let `n1` be the number of `\r` ascii characters in the `SourceCode`
Let `n2` be the number of `\n` ascii characters in the `SourceCode`

If both `n1` and `n2` are nonzero, then `NewLine` is the string *"\r\n"*
If `n1` is nonzero and `n2` is zero, then `NewLine` is the string *"\r"*
If `n1` is zero, then `NewLine` is the string *"\n"*

**Note 1:** If there are no new line characters, then `NewLine` is *"\n"*

# Comment

One of:

- `InlineComment`
- `MultilineComment`

# InlineComment

```
InlineComment := "//" A B
```

`A` is any string which doesn't contain parts of `NewLine`
`B` is either `NewLine` or the end of the `SourceCode`

**Node 1:** `B` is not a part of the `Comment`, but it is required to be at that position

# MultilineComment

```
MultilineComment := "/*" A "*/"
```

`A` is any string which doesn't contain `*/` substring