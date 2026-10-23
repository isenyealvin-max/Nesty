exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const userMessages = (body.messages || []).slice(-20);

    const messages = [
      {
        role: "system",
        content:
          "You are Nesty AI, a warm, friendly and helpful general-purpose AI assistant. Talk naturally, like a kind and smart friend. Give clear, accurate and honest answers. Keep answers short unless the user wants detail. If you are not sure about something, say so. Always reply in the same language the user writes in. Whenever the user asks you to write something they may want to copy, such as an email, letter, essay, message, poem, or any code, put that text inside a code block using triple backticks so it gets a Copy button. You cannot generate images. If the user asks for a picture, say politely that you cannot make images yet and offer to describe one in words instead.",
      },
      ...userMessages,
    ];

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

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "Server error. Please try again." }),
    };
  }
};
