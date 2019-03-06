import {
  getCharString,
  getBoolString,
  getPascalString,
  getJsCodeResult
} from './utils'

describe('the char string function', () => {
  it('returns correct charstring based on one length and fillchar', () => {
    expect(getCharString(4, '*')).toBe('****')
  })

  it('returns correct charstring based on length, total length and two fill chars', () => {
    expect(getCharString(4, '*', 8, '-')).toBe('****----')
  })

  it('ignores a total lenght without fill char when in bounds', () => {
    expect(getCharString(4, '*', 8)).toBe('****')
  })

  it('Handles an out of bounds length correctly', () => {
    expect(getCharString(5, '*', 4)).toBe('****')
  })
})

describe('the bool string function', () => {
  it('returns the correct string based on the provided boolean', () => {
    expect(getBoolString(true, 'yes', 'no')).toBe('yes')
    expect(getBoolString(false, 'yes', 'no')).toBe('no')
  })

  it('returns the correct string with one parameter', () => {
    expect(getBoolString(true, 'yes')).toBe('yes')
    expect(getBoolString(false, 'yes')).toBe('')
  })
})

describe('the Pascal case function', () => {
  it('returns a pascal cased string', () => {
    expect(getPascalString('test string')).toBe('TestString')
    expect(getPascalString('Test String')).toBe('TestString')
    expect(getPascalString('Test-String')).toBe('TestString')
    expect(getPascalString('test-string')).toBe('TestString')
  })

  it('returns the unmodified string if it is already pascal case', () => {
    expect(getPascalString('TestString')).toBe('TestString')
    expect(getPascalString('')).toBe('')
  })
})

describe('the get JS result function', () => {
  it('executes js', () => {
    expect(getJsCodeResult('[0,1,2,3,4].join("")')).toBe('01234')
  })

  it('exposes the variables on the var object', () => {
    expect(getJsCodeResult('testVar', {testVar: 'TestString'})).toBe('TestString')
  })
})
