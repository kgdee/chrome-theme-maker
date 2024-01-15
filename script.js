

const nameInput = document.getElementById("nameInput")
const imageInput = document.getElementById("imageInput")
const backgroundColorInput = document.getElementById("backgroundColorInput")
const frameColorInput = document.getElementById("frameColorInput")
const textColorInput = document.getElementById("textColorInput")
const themePreview = document.querySelector(".theme-preview")

function createManifestData() {
  const frameColor = hexToRGB(frameColorInput.value)
  const backgroundColor = hexToRGB(backgroundColorInput.value)
  const textColor = hexToRGB(textColorInput.value)

  let manifestData = {
    "name": nameInput.value,
    "version": "1.0",
    "description": "",
    "manifest_version": 3,
    "theme": {
      "images": { "theme_ntp_background": "images/theme_ntp_background.jpeg" },
      "colors": {
        "frame": [...frameColor, 1],
        "toolbar": [...backgroundColor, 1],
        "tab_text": [...textColor, 1],
        "tab_background_text": [...textColor, 0.8],
        "bookmark_text": [...textColor, 1],
        "ntp_background": [...backgroundColor, 1],
        "ntp_text": [...textColor, 1],
        "ntp_link": [6,55,116],
        "button_background": [0,0,0,0]
      },
      "tints": { "buttons": normalizedRGB(textColor) },
      "properties": { "ntp_background_alignment": "top", "ntp_background_repeat": "no-repeat" }
    }
  }

  if (imageInput.files.length <= 0) delete manifestData.theme.images

  return manifestData
}

function createAndDownloadRAR() {
  // Create a new instance of JSZip
  var zip = new JSZip();

  // Create a folder
  var folder = zip.folder("images");

  // Add the image file to the folder
  if (imageInput.files.length > 0) {
    const imageFile = imageInput.files[0]
    folder.file("theme_ntp_background.jpeg", imageFile)
  }

  // Add a manifest.json file to the zip
  const manifestData = createManifestData()
  zip.file("manifest.json", JSON.stringify(manifestData))


  // Generate the ZIP file
  zip.generateAsync({ type: "blob" })
    .then(function (content) {
      // Create a download link
      var link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${nameInput.value || "My Theme"}.rar`

      // Trigger the download
      link.click();
    });
}



function hexToRGB(hex) {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');

  // Parse the individual RGB components
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r,g,b]
}

function normalizedRGB(rgb) {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  return [r,g,b]
}


function updateThemePreview() {
  const message = {
    backgroundColor: backgroundColorInput.value,
    frameColor: frameColorInput.value,
    textColor: textColorInput.value
  }

  themePreview.contentWindow.postMessage(message)
}


const reader = new FileReader()
reader.onload = function(event) {
  themePreview.contentWindow.postMessage({ image: event.target.result })
};

function handleImageInput() {
  if (imageInput.files.length <= 0) return

  // Read the file as data URL
  reader.readAsDataURL(imageInput.files[0]);
}