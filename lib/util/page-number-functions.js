const { isNumber } = require('./string-functions')

exports.findPageNumbers = (hashTable, pageIndex, items) => {
  const topArea = Math.floor(1 / 6 * items.length)
  const bottomArea = Math.floor(5 / 6 * items.length)

  for (let x = 0; x < topArea; x++) {
    if (isNumber(items[x].str)) {
      if (!hashTable[pageIndex]) {
        hashTable[pageIndex] = []
      }
      hashTable[pageIndex].push(Number(items[x].str))
    }
  }

  for (let x = bottomArea; x < items.length; x++) {
    if (isNumber(items[x].str)) {
      if (!hashTable[pageIndex]) {
        hashTable[pageIndex] = []
      }
      hashTable[pageIndex].push(Number(items[x].str))
    }
  }
  return hashTable
}

exports.findFirstPage = (hashTable) => {
  let counter = 0
  const keys = Object.keys(hashTable)

  for (let x = 0; x < keys.length; x++) {
    const firstPage = hashTable[keys[x]]
    const secondPage = hashTable[keys[x + 1]]
    const prevCounter = counter

    let pageDetails
    if (x > 0) {
      pageDetails = Object.entries(hashTable)[x - 1]
    } else {
      pageDetails = Object.entries(hashTable)[x]
    }

    for (let y = 0; y < firstPage.length && counter < 2; y++) {
      for (let z = 0; z < secondPage.length && counter < 2; z++) {
        const pageDifference = keys[x + 1] - keys[x]
        if (firstPage[y] + 1 === secondPage[z]) {
          counter++
        } else if (pageDifference > 1 && firstPage[y] + pageDifference === secondPage[z]) {
          counter++
        }
      }
    }

    if (prevCounter === counter) {
      counter = 0
      pageDetails = Object.entries(hashTable)[x]
    } else if (counter >= 2) {
      return { pageIndex: Number(pageDetails[0]), pageNum: pageDetails[1][0] }
    }
  }
}
