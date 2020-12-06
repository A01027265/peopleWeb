const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    group_name: {
        type: String,
        required: 'Group name is required',
        trim: true
    },
    image: {
        type: String,
        required: false,
        default: ''
    },
    group_people: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false,
        default: undefined
    }
});

module.exports = mongoose.model('group', groupSchema);