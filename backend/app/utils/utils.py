def append_response_text(messages, role, text):
    # print("Appending response text:", text)
    if text is None:
        text = ""
    messages.append({"role": role, "content": text})
