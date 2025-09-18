import gradio as gr
import numpy as np
import random

from diffusers import StableDiffusionPipeline
import torch
import devicetorch
import gc

device = devicetorch.get(torch)

if torch.cuda.is_available():
    torch_dtype = torch.bfloat16
elif torch.backends.mps.is_available():
    torch_dtype = torch.bfloat16
else:
    torch_dtype = torch.float32

pipe = None
selected = None

MAX_SEED = np.iinfo(np.int32).max
MAX_IMAGE_SIZE = 1024

def set_default(model_name):
    if model_name == "3.5 large turbo":
        return gr.update(value=0.0), gr.update(value=4)
    elif model_name == "3.5 large":
        return gr.update(value=4.5), gr.update(value=40)
def infer(
    prompt,
    negative_prompt="",
    seed=42,
    randomize_seed=False,
    width=1024,
    height=1024,
    guidance_scale=0.0,
    num_inference_steps=4,
    model_name="3.5 large turbo",
    progress=gr.Progress(track_tqdm=True),
):
    if randomize_seed:
        seed = random.randint(0, MAX_SEED)

    generator = torch.Generator().manual_seed(seed)

    if model_name == "3.5 large turbo":
        model_repo_id = "https://huggingface.co/cocktailpeanut/sd35/blob/main/sd3.5_large.safetensors"
    elif model_name == "3.5 large":
        model_repo_id = "https://huggingface.co/cocktailpeanut/sd35turbo/blob/main/sd3.5_large_turbo.safetensors"

    global pipe
    global selected
    if selected != model_repo_id:
        if pipe != None:
            del pipe
        gc.collect()
        devicetorch.empty_cache(torch)
        gc.collect()

        #pipe = DiffusionPipeline.from_pretrained(model_repo_id, torch_dtype=torch_dtype)
        pipe = StableDiffusionPipeline.from_single_file(model_repo_id, torch_dtype=torch_dtype)
        pipe = pipe.to(device)
        selected = model_repo_id

    image = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        guidance_scale=guidance_scale,
        num_inference_steps=num_inference_steps,
        width=width,
        height=height,
        generator=generator,
    ).images[0]

    gc.collect()
    devicetorch.empty_cache(torch)
    gc.collect()

    return image, seed


examples = [
        "A capybara wearing a suit holding a sign that reads Hello World",
]

css = """
#col-container {
    margin: 0 auto;
    max-width: 640px;
}
"""

with gr.Blocks(css=css) as demo:
    with gr.Column(elem_id="col-container"):
        with gr.Row():
            prompt = gr.Text(
                label="Prompt",
                show_label=False,
                max_lines=1,
                placeholder="Enter your prompt",
                container=False,
            )

            run_button = gr.Button("Run", scale=0, variant="primary")

        result = gr.Image(label="Result", show_label=False)

        model_name = gr.Dropdown(value="3.5 large turbo", choices=["3.5 large turbo", "3.5 large"])

        with gr.Accordion("Advanced Settings"):
            negative_prompt = gr.Text(
                label="Negative prompt",
                max_lines=1,
                placeholder="Enter a negative prompt",
                visible=False,
            )

            seed = gr.Slider(
                label="Seed",
                minimum=0,
                maximum=MAX_SEED,
                step=1,
                value=0,
            )

            randomize_seed = gr.Checkbox(label="Randomize seed", value=True)

            with gr.Row():
                width = gr.Slider(
                    label="Width",
                    minimum=512,
                    maximum=MAX_IMAGE_SIZE,
                    step=32,
                    value=1024, 
                )

                height = gr.Slider(
                    label="Height",
                    minimum=512,
                    maximum=MAX_IMAGE_SIZE,
                    step=32,
                    value=1024,
                )

            with gr.Row():
                guidance_scale = gr.Slider(
                    label="Guidance scale",
                    minimum=0.0,
                    maximum=7.5,
                    step=0.1,
                    value=0.0,
                )

                num_inference_steps = gr.Slider(
                    label="Number of inference steps",
                    minimum=1,
                    maximum=50,
                    step=1,
                    value=4, 
                )

        model_name.change(set_default, inputs=[model_name], outputs=[guidance_scale, num_inference_steps])
        gr.Examples(examples=examples, inputs=[prompt], outputs=[result, seed], fn=infer, cache_examples=True, cache_mode="lazy")
    gr.on(
        triggers=[run_button.click, prompt.submit],
        fn=infer,
        inputs=[
            prompt,
            negative_prompt,
            seed,
            randomize_seed,
            width,
            height,
            guidance_scale,
            num_inference_steps,
            model_name,
        ],
        outputs=[result, seed],
    )

if __name__ == "__main__":
    demo.launch()

