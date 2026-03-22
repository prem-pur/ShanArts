const mongoose = require('mongoose');
require('dotenv').config();
const DesignTemplate = require('../DesignTemplate');

const templates = [
    {
        name: "Simple Poster",
        type: "poster",
        layoutJson: {
            width: 800,
            height: 600,
            elements: [
                { type: "text", key: "textContent", x: 400, y: 300, fontSize: 50, color: "#333", textAlign: "center" },
                { type: "text", text: "Big Sale!", x: 400, y: 100, fontSize: 60, color: "red", textAlign: "center" }
            ]
        },
        defaultColors: ["#ffffff", "#f0f0f0"]
    },
    {
        name: "Modern Banner",
        type: "banner",
        layoutJson: {
            width: 1200,
            height: 400,
            elements: [
                { type: "text", key: "textContent", x: 600, y: 200, fontSize: 40, color: "#fff", textAlign: "center" },
                { type: "text", text: "Limited Time Offer", x: 100, y: 50, fontSize: 30, color: "#ffd700", textAlign: "left" }
            ]
        },
        defaultColors: ["#000000"]
    }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to DB");
        await DesignTemplate.deleteMany({});
        await DesignTemplate.insertMany(templates);
        console.log("Templates seeded");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
