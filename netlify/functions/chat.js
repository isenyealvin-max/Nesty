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
          "You are Nesty AI, a helpful, honest and friendly general-purpose AI assistant. Give clear, accurate answers.",
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
