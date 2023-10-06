const mongoose = require('mongoose')

const levelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: [true, "Level already exists...!"]
    }
});


const Level = new mongoose.model('Level', levelSchema)

module.exports = Level