export const SYSTEM_PROMPT = `You are a quiz generator for an educational game.
Respond with ONLY a valid JSON object, no markdown fences, no commentary. Schema:
{"topic": string, "questions": [{"id": int, "difficulty": "Easy"|"Medium"|"Hard"|"Expert", "question": string, "options": [string, string, string], "correct_index": int, "explanation": string}]}
Rules:
- Exactly 3 options per question.
- Options MUST be 1 to 3 words maximum so they are immediately readable.
- correct_index is 0, 1, or 2 (randomized).
- Generate exactly 6 questions.
- NEVER repeat or closely rephrase any question from the excluded list.`;

export async function fetchAIQuestionsBatch(topic, batchNum, existingQuestions) {
	let difficultyDirective = "";
	if (batchNum === 1) {
		difficultyDirective = "Tier 1: Foundational high-school level. Ramp from Easy (q1-2) to Medium (q3-4) to Hard (q5-6).";
	} else if (batchNum === 2) {
		difficultyDirective = "Tier 2: College/Advanced level. Ramp from Medium (q1-2) to Hard (q3-4) to Expert (q5-6). Focus on deeper mechanisms and specific details.";
	} else {
		difficultyDirective = `Tier ${batchNum}: Master / Expert level. Questions must test advanced trivia, nuances, dates, formulas, or deep conceptual mastery.`;
	}

	const pastQuestionStrings = existingQuestions.map(q => `"${q.question}"`).slice(-18).join(", ");
	const userPrompt = `Generate 6 new questions for topic: "${topic}".
Difficulty level: ${difficultyDirective}.
CRITICAL - DO NOT repeat any of these already used questions: [${pastQuestionStrings}].
Keep all options strictly 1 to 3 words.`;

	const payload = {
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: userPrompt }
		],
		temperature: 0.7,
		reasoning_effort: "low"
	};

	const res = await fetch("https://llm.technobyte.cc/v1/chat/completions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});

	if (!res.ok) throw new Error("HTTP_" + res.status);
	const data = await res.json();
	let content = data?.choices?.[0]?.message?.content;
	if (!content) throw new Error("Empty response");

	let cleaned = content.trim();
	if (cleaned.startsWith("```")) {
		cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
	}
	const start = cleaned.indexOf("{");
	const end = cleaned.lastIndexOf("}");
	if (start !== -1 && end !== -1) {
		cleaned = cleaned.substring(start, end + 1);
	}

	const parsed = JSON.parse(cleaned);
	if (!parsed.questions || parsed.questions.length < 3) throw new Error("Malformed batch questions");
	return parsed.questions;
}
