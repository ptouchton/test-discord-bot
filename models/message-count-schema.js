const { Schema, models, model } = require('mongoose');

const messageCountSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    messageCount: {
        type: Number,
        default: 0
    }
});

const name = "message-count";
module.exports =  models[name] || model(name, messageCountSchema);;