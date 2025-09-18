module.exports = {
  "run": [
    // 1. Download Modles
    {
      "method": "script.start",
      "params": {
        "uri": "hf.json",
        "params": {
          "repo": "comfyanonymous/flux_text_encoders",
          "files": "clip_l.safetensors",
          "path": "app/models/clip"
        }
      }
    },
    {
      "method": "script.start",
      "params": {
        "uri": "hf.json",
        "params": {
          "repo": "comfyanonymous/flux_text_encoders",
          "files": "t5xxl_fp16.safetensors",
          "path": "app/models/clip"
        }
      }
    },
    {
      "method": "script.start",
      "params": {
        "uri": "hf.json",
        "params": {
          "repo": "cocktailpeanut/xulf-schnell",
          "files": "ae.sft",
          "path": "app/models/vae"
        }
      }
    },
    {
      "method": "script.start",
      "params": {
        "uri": "hf.json",
        "params": {
          "repo": "cocktailpeanut/xulf-schnell",
          "files": "flux1-schnell.sft",
          "path": "app/models/unet"
        }
      }
    },
  ]
}
