const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiModel = (modelName = 'gemini-3-flash-preview') => {
    return genAI.getGenerativeModel({ model: modelName });
};

const generateContent = async (prompt, modelName = 'gemini-3-flash-preview') => {
    try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini AI Error:', error.message);
        throw new Error('AI service temporarily unavailable');
    }
};

module.exports = { genAI, getGeminiModel, generateContent };