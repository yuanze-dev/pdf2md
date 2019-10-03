const pdfjs = require('pdfjs-dist')
const { isNumber } = require('./string-functions')
const TextItem = require('../models/TextItem')
const Page = require('../models/Page')

const NO_OP = () => {}

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
      return pageDetails
    }
  }
}

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

exports.parse = async function parse (docOptions, callbacks) {
  const { metadataParsed, pageParsed, fontParsed, documentParsed } = {
    metadataParsed: NO_OP,
    pageParsed: NO_OP,
    fontParsed: NO_OP,
    documentParsed: NO_OP,
    ...(callbacks || {}),
  }
  const pdfDocument = await pdfjs.getDocument(docOptions).promise
  const metadata = await pdfDocument.getMetadata()
  metadataParsed(metadata)

  const pages = [...Array(pdfDocument.numPages).keys()].map(
    index => new Page({ index })
  )

  documentParsed(pdfDocument, pages)

  const fonts = {
    ids: new Set(),
    map: new Map(),
  }

  let hashTable = {}
  let pageDetails
  for (let j = 1; j <= pdfDocument.numPages; j++) {
    const page = await pdfDocument.getPage(j)
    const textContent = await page.getTextContent()

    if (Object.keys(hashTable).length < 10) {
      hashTable = exports.findPageNumbers(hashTable, page.pageIndex, textContent.items)
    } else {
      pageDetails = exports.findFirstPage(hashTable)
      break
    }
  }

  for (let j = 1; j <= pdfDocument.numPages; j++) {
    const page = await pdfDocument.getPage(j)

    // Trigger the font retrieval for the page
    await page.getOperatorList()

    const scale = 1.0
    const viewport = page.getViewport({ scale })
    const textContent = await page.getTextContent()
    const textItems = textContent.items.map(item => {
      const tx = pdfjs.Util.transform(
        viewport.transform,
        item.transform
      )

      const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]))
      const dividedHeight = item.height / fontHeight
      return new TextItem({
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
        height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
        text: item.str,
        font: item.fontName,
      })
    })
    pages[page.pageIndex].items = textItems
    pageParsed(pages)

    const fontIds = new Set(textItems.map(t => t.font))
    for (const fontId of fontIds) {
      if (!fonts.ids.has(fontId) && fontId.startsWith('g_d')) {
        // Depending on which build of pdfjs-dist is used, the
        // WorkerTransport containing the font objects is either transport or _transport
        const transport = pdfDocument.transport || pdfDocument._transport // eslint-disable-line no-underscore-dangle
        const font = await new Promise(
          resolve => transport.commonObjs.get(fontId, resolve)
        )
        fonts.ids.add(fontId)
        fonts.map.set(fontId, font)
        fontParsed(fonts)
      }
    }
  }
  return {
    fonts,
    metadata,
    pages,
    pdfDocument,
  }
}
