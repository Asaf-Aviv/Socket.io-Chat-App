const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

      
const feedbackSchema = new Schema({}, { strict: false });
const Feedback = mongoose.model('feedback', feedbackSchema);

module.exports = Feedback;