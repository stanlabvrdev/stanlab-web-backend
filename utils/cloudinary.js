const config = require('config')
const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: 'stanlab',
    api_key: config.get('cloudinary_api_key'),
    api_secret: config.get('cloudinary_secret_key'),
})

module.exports = { cloudinary }