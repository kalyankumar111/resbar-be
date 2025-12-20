import QRCode from 'qrcode';

/**
 * Generates a Base64 Data URI for a QR code image.
 * @param {string} token - The unique table token.
 * @returns {Promise<string>} - Base64 Image string.
 */
export const generateQRCode = async (token) => {
    try {
        // In a real scenario, this would be a full URL pointing to your frontend.
        // e.g., `https://myrestaurant.com/table/${token}`
        const url = `https://antigravity-pos.vercel.app/table/${token}`;
        const qrCodeImage = await QRCode.toDataURL(url);
        return qrCodeImage;
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw new Error('Failed to generate QR code');
    }
};
