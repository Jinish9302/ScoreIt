const declarePrototypes = () => {
    Object.prototype.with = function (...args) {
        let newObj = {}
        for (let key in this) {
            if (args.includes(key)) {
                newObj[key] = this[key]
            }
        }
        return newObj
    };
};

export default declarePrototypes;