

import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'
import ejs from './ejs'

const { promptMessages } = require('./constants')

/**
 * Create a string filled with chars 
 *
 * @param {number} length - Amount fo char's to fill
 * @param {string} char - Char to use for string
 * @param {number} totalLength - The total lenght of the string (optional)
 * @param {string} fillChar - The char to fill the empty space with (optional)
 * @return {string} The created string
 */
export const getCharString = (length, char, totalLength, fillChar = '') => {
  return Array(totalLength || length).fill(fillChar).map((u, i) => i >= length ? fillChar : char).join('')
}

/**
 * Return a string based on boolean
 *
 * @param {number} boolean - Truethy or falsy string
 * @param {string} trueString - String to return for true
 * @param {number} falseString - String to return for false (optional)
 * @return {string} The created string
 */
export const getBoolString = (boolean, trueString, falseString = '') => {
  return boolean ? trueString : falseString
}

/**
 * Get the Pascal case string 
 *
 * @param {number} string - Initial string
 * @return {string} Pascal case string
 */
export const getPascalString = (string) => {
  return upperFirst(camelCase(string))
}

/**
 * Get excecuted JS in a string
 *
 * @param {string} jsCode - The Js code to execute
 * @param {object} varObject - The object with data to expose (optional)
 * @return {string} The result of the code
 */
export const getJsCodeResult = (jsCode, varObject = {}) => {
  return ejs.render(`<%=${jsCode}%>`, varObject) || ''
}

/**
 * Get title for the corresponing user prompt
 *
 * @param {string} key - The key corresponding to desired prompt
 * @return {string} The title corresponding to desired prompt
 */
export const getPromptTitle = (key) => {
  return (promptMessages[key] && promptMessages[key].title) || `Please input: ${key}`
}

/**
 * Get description for the corresponing user prompt
 *
 * @param {string} key - The key corresponding to desired prompt
 * @return {string} The description corresponding to desired prompt
 */
export const getPromptDescription = (key) => {
  return (promptMessages[key] && promptMessages[key].description) || ''
}