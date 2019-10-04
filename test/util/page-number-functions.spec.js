const { expect } = require('chai')
const { findPageNumbers, findFirstPage } = require('../../lib/util/page-number-functions')

describe('functions: findPageNumbers', () => {
  it('Search, coerce and store page number', () => {
    const array = [{ str: '1' }, { str: 'test' }, { str: 'how' }, { str: 'to' }, { str: 'find' }, { str: 'page' }, { str: '3' }, { str: 'number' }]
    expect(findPageNumbers({}, 3, array)).to.eql({ 3: [1, 3] })
  })
})

describe('functions: findFirstPage', () => {
  it('Return first page index and number with completed Hashtable', () => {
    const hashTable = {
      20: [3],
      21: [4],
      22: [5],
      23: [6],
      24: [7],
      25: [8],
      26: [9],
      27: [10],
      28: [11],
      30: [13],
    }
    expect(findFirstPage(hashTable)).to.eql({ pageIndex: 20, pageNum: 3 })
  })

  it('Return first page index and number with incompleted Hashtable', () => {
    const hashTable = {
      2: [19, 86, 1986, 110],
      5: [137, 151],
      9: [1],
      10: [4],
      12: [6],
      13: [8, 7],
      14: [8],
      15: [10, 9],
      16: [11, 12, 10],
      17: [11],
    }
    expect(findFirstPage(hashTable)).to.eql({ pageIndex: 10, pageNum: 4 })
  })
})
