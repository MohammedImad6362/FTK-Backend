const mongoose = require('mongoose')

const privilegeSchema = new mongoose.Schema({
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level',
        //to check existance of ref-id
        validate: {
            validator: function (value) {
                return mongoose.model('Level').exists({ _id: value });
            },
            message: 'Level does not exist..!'
        },
        required: true
    },
    categories: [{
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
        activity_id: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Activity',
            validate: {
                validator: function (value) {
                    return mongoose.model('Activity').exists({ _id: value });
                },
                message: 'Activity does not exist..!'
            },
            required: true
        }],
    }]
})

const instituteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: [true, "Institute already exists...!"],
        uppercase: true
    },
    subscription_type: {
        type: String,
        uppercase: true,
        enum: ['FREE', 'PAID'],
        required: true,
    },
    subscription_expiry: {
        type: Date,
        required: function () {
            return this.subscription_type === 'Paid';
        }
    },
    activity_privileges: {
        type: [privilegeSchema],
        default: undefined, // Set the default value to undefined
        select: false, // Don't include activity_privileges in query results when its value is null or empty
    }
})

const Institute = new mongoose.model('Institute', instituteSchema)

module.exports = Institute