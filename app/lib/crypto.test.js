var TestModule = require('./crypto')

describe('Crypto Library', () => {
  let word = 'Test123'
  let hash
  it('hashString', async () => {
    hash = await TestModule.hashString(word)
    expect(hash).toBeTruthy()
    expect(hash).not.toBe(word)
  })
  it('verifyString', async () => {
    expect(await TestModule.verifyString(word, hash)).toBe(true)
    expect(await TestModule.verifyString('Test456', hash)).toBe(false)
  })
})
