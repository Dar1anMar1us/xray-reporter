function isEmptyOrWhiteSpace(str){
    return str === null || str.match(/^ *$/) !== null;
}

module.exports = { isEmptyOrWhiteSpace };