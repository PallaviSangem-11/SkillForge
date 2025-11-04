module.exports = {
    webpack: {
        configure: {
            ignoreWarnings: [
                {
                    module: /chart\.js/,
                    message: /Failed to parse source map/,
                }
            ]
        }
    }
};