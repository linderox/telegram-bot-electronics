module.exports = {
    apps : [
        {
            name: "bot",
            script: "python3.11",
            args: ["-m", "bot", "--mode", "prod"],
            interpreter_args: "-u",
            instances: 1,
            autorrestart: true
        }
    ]
}