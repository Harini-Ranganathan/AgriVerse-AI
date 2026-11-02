const cloudinary = require("cloudinary").v2

cloudinary.config({
  cloud_name: "dhlgucepf",
  api_key: "419916172954816",
  api_secret: "pDQaRwCt1UZnnJndmImSZa0fqEI",
  secure: true,
});

module.exports = cloudinary;