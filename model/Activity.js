const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema({
    name: {
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
        required: true
    },
    thumbnail: {
        type: String,
        required: true,
    },
    point: {
        type: Number,
    }
})

const Activity = new mongoose.model('Activity', activitySchema)

module.exports = Activity