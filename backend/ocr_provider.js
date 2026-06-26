const Tesseract = require('tesseract.js');

class OcrProvider {
  /**
   * Recognizes text and other data from a receipt image.
   * @param {string} filePath - Absolute path to local image.
   * @returns {Promise<{text: string, confidence: number}>}
   */
  async recognize(filePath) {
    throw new Error('recognize method must be implemented by concrete providers.');
  }
}

class TesseractOcrProvider extends OcrProvider {
  async recognize(filePath) {
    const worker = await Tesseract.createWorker('kor+eng');
    const { data: { text, confidence } } = await worker.recognize(filePath);
    await worker.terminate();
    return {
      text: text || '',
      confidence: confidence || 0.0
    };
  }
}

class OcrProviderFactory {
  static getProvider() {
    const providerName = process.env.OCR_PROVIDER || 'tesseract';
    switch (providerName.toLowerCase()) {
      case 'tesseract':
      default:
        return new TesseractOcrProvider();
    }
  }
}

module.exports = {
  OcrProvider,
  TesseractOcrProvider,
  OcrProviderFactory
};
