import os
from transformers import AutoModelForCausalLM, AutoTokenizer


DEFAULT_MZANSILM_MODEL_ID = "/app/model/mzansilm-125m"


class Mzansilm:

    def __init__(self):
        model_id = os.getenv("LLM_MODEL_ID", DEFAULT_MZANSILM_MODEL_ID)
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.model = AutoModelForCausalLM.from_pretrained(model_id)

    def generate(self, prompt: str, max_length: int = 50):
        inputs = self.tokenizer(prompt, return_tensors="pt")
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=max_length,
            pad_token_id=self.tokenizer.pad_token_id,
        )
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)


if __name__ == "__main__":
    mzansilm = Mzansilm()
    prompt = "Molo!"
    print(mzansilm.generate(prompt))
