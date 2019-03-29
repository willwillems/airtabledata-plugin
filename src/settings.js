const sketch = require('sketch')
const { UI } = sketch
const Settings = require('sketch/settings')
const document = require('sketch/dom').getSelectedDocument()

const {
  getPromptTitle,
  getPromptDescription
} = require('./utils')

function changePluginSetting (key) {
  // get the value before change
  const initialVal = Settings.settingForKey(key)
  return new Promise((resolve, reject) => {
    UI.getInputFromUser(getPromptTitle(key),
      // options
      {
        description: getPromptDescription(key),
        initialValue: initialVal
      },
      // callback
      (err, value) => {
        if (err) {
          // most likely the user canceled the input
          console.log('*************** ADPlugin changeDocumentSetting failed', err)
          return reject(initialVal)
        }
        Settings.setSettingForKey(key, value)
        return resolve(value)
      }
    )
  })
}

function changeDocumentSetting (key) {
  // get the value before change
  const initialVal = Settings.documentSettingForKey(document, key)
  return new Promise((resolve, reject) => {
    UI.getInputFromUser(getPromptTitle(key),
      // options
      {
        description: getPromptDescription(key),
        initialValue: initialVal
      },
      // callback
      (err, value) => {
        if (err) {
          // most likely the user canceled the input
          console.log('*************** ADPlugin changeDocumentSetting failed', err)
          return reject(initialVal)
        }
        Settings.setDocumentSettingForKey(document, key, value)
        console.log(`*************** ADPlugin saved new document value: "${key}": "${value}"`)
        return resolve(value)
      }
    )
  })
}

export function changeApiKey () {
  console.log('*************** ADPlugin Triggered changeApiKey function')
  return changePluginSetting('apiKey')
}

export function changeBase (callback) {
  console.log('*************** ADPlugin Triggered changeBase function')
  return changePluginSetting('baseToken')
}

export function changeActiveTable (callback) {
  console.log('*************** ADPlugin Triggered changeActiveTable function')
  return changeDocumentSetting('table')
}
