const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        validate: {
            validator: function (value) {
                return mongoose.model('Category').exists({ _id: value });
            },
            message: 'Category does not exist..!'
        },
    },
    description: {
        type: String
    }
})

const Video = new mongoose.model('Video', videoSchema)

module.exports = Video