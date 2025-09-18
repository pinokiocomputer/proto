module.exports = {
  run: [
    {
      "method": "shell.run",
      "params": {
        "venv": "env",
        "message": "pip install gradio==5.5.0 uvicorn==0.13.4",
//        "on": [{
//          "event": "/error:/i",
//          "break": true
//        }, {
//          "event": "/errno /i",
//          "break": true
//        }, {
//          "event": "/error:.*triton/i",
//          "break": false
//        }]
      }
    },
  ]
}

