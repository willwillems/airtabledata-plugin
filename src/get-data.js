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
  getJsCodeResult
} = require('./utils')


const FOLDER = path.join(os.tmpdir(), 'com.sketchapp.airtable-data-plugin')

const promptMessages = {
  'apiKey': 'What is your Airtable API key?',
  'baseToken': 'What is the token of the base you want to use?',
  'table': 'What is the name of the table you want to use?'
}

function getPromptMessage(key) {
  return promptMessages[key] || `Please input: ${key}`
}

function getDocumentSetting (key) {
  // if valid setting return (gives undefined when not defined)
  const setting = Settings.documentSettingForKey(document, key)
  if(setting) return setting
  // else get var trough prompt
  UI.getInputFromUser(getPromptMessage(key), (err, value) => {
      if (err) {
        // most likely the user canceled the input
        return
      }
      Settings.setDocumentSettingForKey(document, key, value)
    }
  )
  // return the new value
  return Settings.documentSettingForKey(document, key)
}

function getPluginSetting (key) {
  // if valid setting return (gives undefined when not defined)
  const setting = Settings.settingForKey(key)
  if(setting) return setting
  // else get var trough prompt
  UI.getInputFromUser(getPromptMessage(key), (err, value) => {
      if (err) {
        // most likely the user canceled the input
        return
      }
      Settings.setSettingForKey(key, value)
    }
  )
  // return the new value
  return Settings.settingForKey(key)
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
        const layer = document.getLayerWithID(item.override.path)
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
        const layer = document.getLayerWithID(item.override.path)
        const layerName = layer.name
        const field = rowData[layerName] || ''
        if(!field) return UI.message('❕No image found, check your layer name.')
        return getImageFromURL(field) // should map with an promise.all
          .then(imagePath => {
            DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)
          })
      })
    })
    .catch((e) => {
      UI.message('❗️Something went wrong.')
    })
}

function getAirtableData({ count }) {
  return fetch(`https://api.airtable.com/v0/${getPluginSetting('baseToken')}/${getDocumentSetting('table')}?maxRecords=${count}&view=Grid%20view`, {
    headers: {
      'Authorization': `Bearer ${getPluginSetting('apiKey')}`
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
  console.log('getting image')
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
  console.log('saving temp file')
  const guid = NSProcessInfo.processInfo().globallyUniqueString()
  const imagePath = path.join(FOLDER, `${guid}.jpg`)
  try {
    fs.mkdirSync(FOLDER)
    console.log('created dir')
  } catch (err) {
    console.log('saving temp file error 1')
    // probably because the folder already exists
    // TODO: check that it is really because it already exists
  }
  try {
    fs.writeFileSync(imagePath, imageData, 'NSData')
    console.log('wrote file', imagePath)
    return imagePath
  } catch (err) {
    console.error(err)
    return undefined
  }
}
