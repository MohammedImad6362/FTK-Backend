const mongoose = require('mongoose')

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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

const Branch = new mongoose.model('Branch', branchSchema)

module.exports = Branch