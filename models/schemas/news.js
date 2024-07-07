const mongoose = require('mongoose');

const { Schema } = mongoose;

const newsSchema = new Schema(
    {
        id: String,
        text: String,
        title: String,
        user: String,
    },
    {
        versionKey: false,
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

const News = mongoose.model('News', newsSchema);

module.exports = News;
