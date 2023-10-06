const mongoose = require('mongoose')
const validator = require('validator')

//Schema for point
const pointSchema = new mongoose.Schema({
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
    activities: [{
        activity_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Activity',
            validate: {
                validator: function (value) {
                    return mongoose.model('Activity').exists({ _id: value });
                },
                message: 'Activity does not exist..!'
            },
            required: true
        },
        point: {
            type: Number,
            required: true
        }
    }]
});


//Schema for user ---which includes all admin, parent and student
const userSchema = new mongoose.Schema({

//Generating ObjectId with logic
    _id: {
    type: String, // Use String type to store the custom ObjectId as a string
    default: function () {
        // Generate a custom ObjectId based on user role
        if (this.role) {
            const rolePrefix = this.role.substring(0, 3).toUpperCase(); // First three letters of role in uppercase
            const randomPart = new mongoose.Types.ObjectId().toHexString().slice(-19); // 19 characters from the end of the 12-byte hexadecimal string
            return `${rolePrefix}_${randomPart}`;
        }
    },
},
    name: {
        type: String,
        minlength: [3, 'Name should be min 3 chars'],
        uppercase: true
    },
    email: {
        type: String,
        required: function () {
            return this.role === 'ADMIN';
        },
        unique: [true, "Email already exists...!"],
        index: { sparse: true },      //allows multiple doc's email to be null
        validate(email) {
            if (!validator.isEmail(email)) {
                throw new Error("inValid email...!")
            }
        },
        select: false
    },
    password: {
        type: String,
        minlength: [6, "Password should be min 6 chars"],
        required: function () {
            return this.role === 'ADMIN';
        },
    },
    mobile: {
        type: String,
        required: function () {
            return this.role === 'PARENT';
        },
        unique: [true, "mobile already exists..!"],
        validate(mobile) {
            if (!validator.isMobilePhone(mobile)) {
                throw new Error("inValid mobile number...!")
            }
        }
    },
    role: {
        type: String,
        uppercase: true,
        required: true,
        enum: ['SUPERADMIN', 'ADMIN', 'PARENT', 'STUDENT']
    },
    parent_id: {
        /* In Mongoose, when you want to create a reference to another document in a different collection,
        you typically use the mongoose.Schema.Types.ObjectId data type */
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function (value) {
                return mongoose.model('User').exists({ _id: value });
            },
            message: 'Parent does not exist..!'
        },
        required: function () {
            return this.role === 'STUDENT';
        },
    },
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        validate: {
            validator: function (value) {
                return mongoose.model('Batch').exists({ _id: value });
            },
            message: 'Batch does not exist..!'
        },
        required: function () {
            return this.role === 'STUDENT';
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
        required: function () { 
            return this.role === 'STUDENT';
        },
    },
    institute_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institute',
        validate: {
            validator: function (value) {
                return mongoose.model('Institute').exists({ _id: value });
            },
            message: 'Institute does not exist..!'
        },
        index: { sparse: true }
    },
    points: {
        type: [pointSchema],       // This specifies an array of objects using the pointSchema
        required: function () {
            return this.role === 'STUDENT';
        },
        select: function (val) {
            // Exclude "points" field for ADMIN and PARENT roles
            return this.role === 'STUDENT' ? val : false;
        }
    }
})


const User = new mongoose.model('User', userSchema)

module.exports = User 