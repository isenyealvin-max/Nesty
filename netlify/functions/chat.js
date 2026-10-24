exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const userMessages = (body.messages || []).slice(-20);
    const name = String(body.userName || "").slice(0, 40);

    let system =
      "You are Nesty AI, a warm, friendly and helpful general-purpose AI assistant. Talk naturally, like a kind and smart friend. Give clear, accurate and honest answers. Keep answers short unless the user wants detail. If you are not sure about something, say so. You cannot browse the internet, so your knowledge may be out of date; say this when a question needs current information. Always reply in the same language the user writes in. Whenever the user asks you to write something they may want to copy, such as an email, letter, essay, message, poem, or any code, put that text inside a code block using triple backticks so it gets a Copy button. You cannot generate images. If the user asks for a picture, say politely that you cannot make images yet and offer to describe one in words instead.";

    if (name) {
      system += " The user's first name is " + name + ". Use it naturally and sparingly, not in every message.";
    }

    const messages = [{ role: "system", content: system }, ...userMessages];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: messages,
          reasoning_effort: "low",
          max_completion_tokens: 4096,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const msg = (data.error && data.error.message) || "Groq error";
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: "Error: " + msg }),
      };
    }

    const choice = data.choices && data.choices[0];
    const text = choice && choice.message && choice.message.content;

    if (!text || !text.trim()) {
      const why = (choice && choice.finish_reason) || "unknown";
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "I could not make an answer this time (" + why + "). Please try again.",
        }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ reply: text }) };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "Server error: " + (e.message || "try again") }),
    };
  }
};
