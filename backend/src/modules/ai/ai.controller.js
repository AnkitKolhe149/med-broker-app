const aiService = require('./ai.service');

module.exports = {
  chat: async (req, res, next) => {
    try {
      const { message, sessionId, context } = req.body || {};

      if (!message || !String(message).trim()) {
        return res.status(400).json({
          success: false,
          message: 'message is required'
        });
      }

      const result = await aiService.chatWithRag({
        message: String(message).trim(),
        sessionId,
        context,
        user: req.user || null
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }
};
