const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    tag_name: String
});

module.exports = mongoose.model('tag', tagSchema);