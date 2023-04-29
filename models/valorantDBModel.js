const mongoose = require('mongoose')


const valorantDBSchema = mongoose.Schema({
    database: {
        type: Object,
    }
}, {
    timestamps: true,
})

module.exports = mongoose.model('ValorantDB', valorantDBSchema)