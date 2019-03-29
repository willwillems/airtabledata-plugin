require("@babel/polyfill");

const sketch = require('sketch')
const { DataSupplier, UI } = sketch
const util = require('util')
const path = require('path')
const os = require('os')
const Settings = require('sketch/settings')
const fs = require('@skpm/fs')
const mapKeys = require('lodash/mapKeys')

const document = require('sketch/dom').getSelectedDocument()

const {
  getCharString,
  getBoolString,
  getPascalString,
  getJsCodeResult,
  getPromptTitle,
  getPromptDescription
} = require('./utils')

const {
  changeApiKey,
  changeBase,
  changeActiveTable
} = require('./settings')


const FOLDER = path.join(os.tmpdir(), 'com.sketchapp.airtable-data-plugin')

async function getApiKey () {
  const setting = Settings.settingForKey('apiKey')
  return setting
    ? setting
    : await changeApiKey()
}

async function getBaseToken () {
  const setting = Settings.settingForKey('baseToken')
  return setting
    ? setting
    : await changeBase()
}

async function getActiveTable () {
  const setting = Settings.documentSettingForKey(document, 'table')
  return setting
    ? setting
    : await changeActiveTable()
}

export function onStartup () {
  console.log('*************** ADPlugin Start: onStartup')

  // Register a method to supply a random list of first names.
  DataSupplier.registerDataSupplier('public.text', 'Airtable Text', 'FillTxt')
  DataSupplier.registerDataSupplier('public.image', 'Airtable Image', 'FillImg')
  console.log('*************** ADPlugin Registered Data suppliers')
}

export function onShutdown () {
  console.log('*************** ADPlugin Shutdown: onShutdown')
  // Deregister the plugin
  DataSupplier.deregisterDataSuppliers()
  // delete temp folder
  try {
    if (fs.existsSync(FOLDER)) {
      fs.rmdirSync(FOLDER)
    }
  } catch (err) {
    console.error(err)
  }
}

export function onFillTxt (context) {
  console.log('*************** ADPlugin FillTxt: onFillTxt')
  let dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  const count = context.data.items.count()

  UI.message('🕑 Fetching data')
  console.log('*************** ADPlugin - Fetching data')
  getAirtableData({count})
    .then(data => {
      const fieldsArray = data.map(d => d.fields)  // get the fields from airtable data
      items.forEach((item, index) => {
        const rowData = fieldsArray[index]
        const layer = (() => {
          if(item.type === 'DataOverride') return document.getLayerWithID(item.override.path)
          return item
        })()
        const layerName = layer.name

        const result = (() => {
          const identifier = layerName.trim().substring(0,1)
          const command = layerName.trim().substring(1).trim()

          const pascalCaseRowData = mapKeys(rowData, (val, key) => getPascalString(key))

          console.log('*************** ADPlugin data:')
          console.log('*************** Identifier: ' + identifier)
          console.log('*************** command: ' + command)

          if (identifier == '>') return getJsCodeResult(command, pascalCaseRowData)
          const dataVar = pascalCaseRowData[command.split(' ')[0]] // get the first arg var from the airtable data 
          const restArgs = command.split(' ').slice(1) // pass the rest on to the functions
          console.log('*************** dataVar: ' + dataVar)
          if (identifier == '#') return getCharString(dataVar, ...restArgs)
          if (identifier == '?') return getBoolString(dataVar, ...restArgs)

          console.log('*************** ADPlugin No command match. Attempt to match to data field')
          return rowData[layerName]
        })()

        if(!result) UI.message('❕No data found, check your layer name.')
        console.log(result)
        DataSupplier.supplyDataAtIndex(dataKey, result || '', index)
      })
    })
    .catch((e) => {
      UI.message('❗️Something went wrong.')
    })
}

export function onFillImg (context) {
  console.log('*************** ADPlugin FillImg: onFillImg');
  let dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  const count = context.data.items.count()

  UI.message('🕑 Fetching data')
  getAirtableData({count})
    .then(data => {
      console.log('*************** ADPlugin fetched airtable data');
      const fieldsArray = data.map(d => d.fields)
      items.forEach((item, index) => {
        const rowData = fieldsArray[index]
        const layer = (() => {
          if(item.type === 'DataOverride') return document.getLayerWithID(item.override.path)
          return item
        })()
        const layerName = layer.name
        const field = (rowData[layerName] && rowData[layerName][0] && rowData[layerName][0].url) || rowData[layerName] || ''
        if(!field) return UI.message('❕No image found, check your layer name.')
        return getImageFromURL(field) // should map with an promise.all
          .then(imagePath => {
            DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)
          })
      })
    })
    .catch((e) => {
      UI.message('❗️Something went wrong.')
      console.error(e)
    })
}

async function getAirtableData({ count }) {
  return fetch(`https://api.airtable.com/v0/${await getBaseToken()}/${await getActiveTable()}?maxRecords=${count}&view=Grid%20view`, {
    headers: {
      'Authorization': `Bearer ${await getApiKey()}`
    }
  })
    .then(res => res.json())
    // TODO: use imageData directly, once #19391 is implemented
    .then(data => {
      return data.records
    })
    .catch((err) => {
      console.error(err)
      return 'error'
    })
}

//
// From: https://github.com/BohemianCoding/unsplash-sketchplugin/blob/master/src/DataProvider.js
//
function getImageFromURL (url) {
  console.log('*************** ADPlugin fetching image from URL')
  return fetch(url)
    .then(res => res.blob())
    // TODO: use imageData directly, once #19391 is implemented
    .then(saveTempFileFromImageData)
    .catch((err) => {
      console.error(err)
      // return context.plugin.urlForResourceNamed('placeholder.png').path()
    })
}

//
// From: https://github.com/BohemianCoding/unsplash-sketchplugin/blob/master/src/DataProvider.js
//
function saveTempFileFromImageData (imageData) {
  console.log('*************** ADPlugin saving temporary file')
  const guid = NSProcessInfo.processInfo().globallyUniqueString()
  const imagePath = path.join(FOLDER, `${guid}.jpg`)
  try {
    fs.mkdirSync(FOLDER)
    console.log(`*************** ADPlugin created directory: ${FOLDER}`)
  } catch (err) {
    console.error(err)
    // probably because the folder already exists
    // TODO: check that it is really because it already exists
  }
  try {
    fs.writeFileSync(imagePath, imageData, 'NSData')
    console.log(`*************** ADPlugin wrote file: ${imagePath}`)
    return imagePath
  } catch (err) {
    console.error(err)
    return undefined
  }
}
