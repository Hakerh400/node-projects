yield [call, yield [pair, arg, func], `yield [snd, arg]`, `
  '1' + (yield [call, yield [pair, yield [snd, arg], yield [fst, arg]],
    \`'1' + (yield [call, '0' + (yield [snd, arg]), yield [fst, arg]])\`,
    \`'0' + (yield [call, '0' + (yield [snd, arg]), yield [fst, arg]])\`,
  ])
`]