const nameInput = document.querySelector(".name-input input");
const imageInput = document.querySelector(".image-input input");
const positionInput = document.querySelector(".position-input select");
const backgroundInput = document.querySelector(".background-input input");
const frameInput = document.querySelector(".frame-input input");
const textInput = document.querySelector(".text-input input");
const preview = document.querySelector(".preview");

let darkTheme = load("darkTheme", false);

document.addEventListener("DOMContentLoaded", function () {
  toggleTheme(darkTheme);
});

function getRGB(color) {
  return chroma(color).rgb();
}

function getHSL(color) {
  const HSL = chroma(color).hsl();
  if (HSL.length > 3) HSL.shift();
  return HSL;
}

function createManifestData() {
  const frameColor = getRGB(frameInput.value);
  const backgroundColor = getRGB(backgroundInput.value);
  const textColor = getRGB(textInput.value);

  let manifestData = {
    name: nameInput.value,
    version: "1.0",
    description: "",
    manifest_version: 2,
    theme: {
      images: { theme_ntp_background: "images/theme_ntp_background.jpeg" },
      colors: {
        frame: [...frameColor, 1],
        toolbar: [...backgroundColor, 1],
        tab_text: [...textColor, 1],
        tab_background_text: [...textColor, 0.8],
        bookmark_text: [...textColor, 1],
        ntp_background: [...backgroundColor, 1],
        ntp_text: [...textColor, 1],
        ntp_link: [6, 55, 116],
        button_background: [0, 0, 0, 0],
      },
      tints: { buttons: getHSL(textInput.value) },
      properties: { ntp_background_alignment: "top", ntp_background_repeat: "no-repeat" },
    },
  };

  if (!imageInput.value) delete manifestData.theme.images;

  return manifestData;
}

async function downloadRAR() {
  var zip = new JSZip();
  var folder = zip.folder("images");

  // Add the image file to the folder
  if (imageInput.value) {
    const imageFile = await getResizedImage();
    folder.file("theme_ntp_background.jpeg", imageFile);
  }

  // Add a manifest.json file to the zip
  const manifestData = createManifestData();
  zip.file("manifest.json", JSON.stringify(manifestData));

  // Generate the ZIP file
  const file = await zip.generateAsync({ type: "blob" });

  const name = `${nameInput.value || "My Theme"}.rar`;
  download(file, name);
}

async function updatePreview() {
  const getImage = async () => {
    if (!imageInput.value) return null;
    const imageFile = await getResizedImage();
    const dataUrl = await getFileDataUrl(imageFile);
    return dataUrl;
  };

  const message = {
    image: await getImage(),
    backgroundColor: backgroundInput.value,
    frameColor: frameInput.value,
    textColor: textInput.value,
  };

  preview.contentWindow.postMessage(message, "*");
}

async function getResizedImage() {
  const file = imageInput.files[0];
  const position = positionInput.value;
  const aspectRatio = 16 / 9;

  const img = await loadImage(file);
  const { width, height } = img;
  const currentAspect = width / height;

  const isWider = currentAspect > aspectRatio;
  let cropWidth = isWider ? height * aspectRatio : width;
  let cropHeight = isWider ? height : width / aspectRatio;

  let offsetX = (width - cropWidth) / 2;
  let offsetY = (height - cropHeight) / 2;

  switch (position) {
    case "left":
      offsetX = 0;
      break;
    case "right":
      offsetX = width - cropWidth;
      break;
    case "top":
      offsetY = 0;
      break;
    case "bottom":
      offsetY = height - cropHeight;
      break;
    default:
      break;
  }

  // Step 1: Crop to the desired aspect ratio
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // Step 2: Resize to 1920x1080
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = 1920;
  finalCanvas.height = 1080;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.drawImage(cropCanvas, 0, 0, 1920, 1080);

  // Step 3: Convert to Blob
  const blob = await new Promise((resolve) => finalCanvas.toBlob((b) => resolve(b), file.type || "image/jpeg"));

  return blob;
}

function toggleTheme(force) {
  const toggle = document.querySelector(".theme-toggle");
  darkTheme = force != null ? force : !darkTheme;
  save("darkTheme", darkTheme);
  document.body.classList.toggle("dark-theme", darkTheme);
  toggle.innerHTML = darkTheme ? `<i class="bi bi-sun"></i>` : `<i class="bi bi-moon"></i>`;
}

function checkOrientation() {
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  const warning = document.querySelector(".orientation-warning");

  warning.classList.toggle("hidden", !isPortrait);
}

checkOrientation();
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);
