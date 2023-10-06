const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String, 
        required: true
    },
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level',
        validate: {
            validator: function (value) {
                return mongoose.model('Level').exists({ _id: value });
            },
            message: 'Level does not exist..!'
        },
        required: true
    }
})


const Category = new mongoose.model('Category', categorySchema)

module.exports = Category