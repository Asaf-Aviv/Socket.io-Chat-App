const iplocation = require('iplocation')

function getLocation(ip) {
    return iplocation(ip)
        .catch(err => {
            console.log(err)
    })
}

module.exports = getLocation