const sketch = require('sketch')
const { UI } = sketch
const Settings = require('sketch/settings')
const document = require('sketch/dom').getSelectedDocument()

const {
  getPromptTitle,
  getPromptDescription
} = require('./utils')

export function changeApiKey () {
  const key = 'apiKey'
  console.log('*************** ADPlugin Triggered changeApiKey function')
  UI.getInputFromUser(getPromptTitle(key),
  { 
    description: getPromptDescription(key),
    initialValue: Settings.settingForKey(key)
  }, (err, value) => {
    if (err) {
      // most likely the user canceled the input
      console.log('*************** ADPlugin changeApiKey failed', err)
      return
    }
    return Settings.setSettingForKey(key, value)
  })
}

export function changeBase () {
  const key = 'baseToken'
  console.log('*************** ADPlugin Triggered changeBase function')
  UI.getInputFromUser(getPromptTitle(key),
  {
    description: getPromptDescription(key),
    initialValue: Settings.settingForKey(key)
  }, (err, value) => {
    if (err) {
      // most likely the user canceled the input
      console.log('*************** ADPlugin changeBase failed', err)
      return
    }
    return Settings.setDocumentSettingForKey(document, key, value)
  })
}

export function changeActiveTable () {
  const key = 'table'
  console.log('*************** ADPlugin Triggered changeActiveTable function')
  UI.getInputFromUser(getPromptTitle(key),
  {
    description: getPromptDescription(key),
    initialValue: Settings.documentSettingForKey(document, key)
  }, (err, value) => {
    if (err) {
      // most likely the user canceled the input
      console.log('*************** ADPlugin changeActiveTable failed', err)
      return
    }
    return Settings.setDocumentSettingForKey(document, key, value)
  })
}