const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `ORD-${year}-${randomNum}`;
};

module.exports = generateOrderNumber;
