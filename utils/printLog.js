const printLog = (logType, ...messages) => {
    let timestamp = new Date().toUTCString()
    switch (logType.toUpperCase()) {
        case "INFO":
            console.log(logType, timestamp, ...messages)
            break;
        case "SUCCESS":
            process.stdout.write("\x1b[32m")
            console.log(logType, timestamp, ...messages)
            break;
        case "ERROR":
            process.stdout.write("\x1b[31m")
            console.error(logType, timestamp, ...messages)
            break;
        case "WARN":
            process.stdout.write("\x1b[33m")
            console.warn(logType, timestamp, ...messages)
            break;
        default:
            throw new Error("Invalid log type")
    }
    process.stdout.write("\x1b[37m")
}

export default printLog;
