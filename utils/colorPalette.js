import { Vibrant } from "node-vibrant/node";

/**
 * Converts an RGB color array to a hex string.
 * @param {number[]} rgb - An array of 3 numbers [r, g, b].
 * @returns {string} The hex color string (e.g., "#RRGGBB").
*/
function rgbToHex([r, g, b]) {
    const toHex = (c) => ('0' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extracts a color palette from an image URL.
 * @param {string} imageUrl The URL of the image to process.
 * @returns {Promise<string[]|null>} A promise that resolves to an array of hex color codes, or null if an error occurs.
*/
const getPaletteFromUrl = async (imageUrl) => {
    if (!imageUrl || !(imageUrl.endsWith('.jpg') || imageUrl.endsWith('.png'))) {
        return null;
    }

    try {
        const paletteObject = await Vibrant.from(imageUrl).getPalette();

        if (!paletteObject) return null;

        const swatches = Object.values(paletteObject);

        const hexPalette = swatches
            .map(swatch => swatch ? rgbToHex(swatch.rgb) : null)
            .filter(Boolean);

        return hexPalette;
    } catch (err) {
        if (!err.message.includes('404')) {
            console.error(`Node-Vibrant Error: Failed to get palette for ${imageUrl}`, err.message);
        }
        return null;
    }
}
export default getPaletteFromUrl;