const mongoose = require('mongoose')

const batchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    },
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        validate: {
            validator: function (value) {
                return mongoose.model('Branch').exists({ _id: value });
            },
            message: 'Branch does not exist..!'
        },
    },
    institute_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institute',
        validate: {
            validator: function (value) {
                return mongoose.model('Institute').exists({ _id: value });
            },
            message: 'Institute does not exist..!'
        },
    }
})

const Batch = new mongoose.model('Batch', batchSchema)

module.exports = Batch