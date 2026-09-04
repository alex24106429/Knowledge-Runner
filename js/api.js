export const SYSTEM_PROMPT_INFINITE = `You are a quiz generator for an educational 3D game.
Respond with ONLY a valid JSON object, no markdown fences, no commentary. Schema:
{"topic": string, "questions": [{"id": int, "difficulty": "Easy"|"Medium"|"Hard"|"Expert", "question": string, "options": [string, string, string], "correct_index": int, "explanation": string}]}
Rules:
- Exactly 3 options per question (representing Left, Center, Right paths).
- Options MUST be 1 to 3 words maximum so they are immediately readable.
- correct_index is 0, 1, or 2 (randomized).
- Generate exactly 6 questions.
- NEVER repeat or closely rephrase any question from the excluded list.`;

export const FALLBACK_QUESTIONS = [
	{ difficulty: "Easy", question: "Which planet is closest to the Sun?", options: ["Mercury", "Venus", "Earth"], correct_index: 0, explanation: "Mercury is the closest planet to the Sun." },
	{ difficulty: "Easy", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter"], correct_index: 1, explanation: "Mars has iron oxide causing its red color." },
	{ difficulty: "Medium", question: "Where is the main asteroid belt?", options: ["Mars & Jupiter", "Earth & Mars", "Jupiter & Saturn"], correct_index: 0, explanation: "The asteroid belt sits between Mars and Jupiter." },
	{ difficulty: "Medium", question: "Which moon is the largest in the solar system?", options: ["Titan", "Europa", "Ganymede"], correct_index: 2, explanation: "Ganymede is larger than Mercury." },
	{ difficulty: "Hard", question: "What is the boundary where the solar wind stops?", options: ["Oort Cloud", "Heliopause", "Kuiper Cliff"], correct_index: 1, explanation: "The heliopause borders interstellar space." },
	{ difficulty: "Hard", question: "Which planet has retrograde geysers on Triton?", options: ["Uranus", "Neptune", "Saturn"], correct_index: 1, explanation: "Triton orbits Neptune retrograde." }
];

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
		model: "minimax/minimax-m3:free",
		messages: [
			{ role: "system", content: SYSTEM_PROMPT_INFINITE },
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
