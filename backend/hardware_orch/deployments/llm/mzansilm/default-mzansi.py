from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "anrilombard/mzansilm-125m"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)

inputs = tokenizer("Namuhla sifunda ngolimi ngoba abantu", return_tensors="pt")
outputs = model.generate(
    **inputs,
    max_new_tokens=50,
    pad_token_id=tokenizer.pad_token_id,
)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))