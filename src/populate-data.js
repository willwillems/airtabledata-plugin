const sketch = require('sketch')

export function populateData() {
  const doc = sketch.getSelectedDocument()
  const selectedLayers = doc.selectedLayers
  const selectedCount = selectedLayers.length

  if (selectedCount === 0) {
    sketch.UI.message('No layers are selected.')
  } else {
    console.log(selectedLayers.layers[0])
    sketch.UI.message(`${selectedCount} layers selected.`)
  }
}