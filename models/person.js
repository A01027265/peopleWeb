const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Create Schema
const personSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: 'First name is required',
        trim: true,
        max: 32
    },
    last_name: {
        type: String,
        required: 'Last name is required',
        trim: true,
        max: 32
    },
    association: {
        type: String,
        required: 'Association is missing',
        trim: true,
        max: 64
    },
    image: {
        type: String,
        required: false,
        default: ''
    },
    acquaintance_level: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
        max: 100
    },
    gender: {
        type: String,
        required: 'Gender is missing'
    },
    age: Number,
    tags: {
        type: [String],
        default: undefined,
        required: false
    },
    notes: {
        type: [String],
        default: undefined,
        required: false
    }
});

personSchema.plugin(mongoosePaginate);

// Export Schema
module.exports = mongoose.model('person', personSchema);
