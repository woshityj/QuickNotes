# Fact-Checking Pipeline Prompts

SENTENCES_TO_CLAIMS_PROMPT = """
Your task is to decompose the text into atomic claims.
Let's define a function named decompose(input:str).
The returned value should be a list of strings, where each string should be a context-independent claim, representing one fact.
For example:
User Input:
decompose("Mary is a five-year old girl, she likes playing piano and she doesn't like cookies.")
Response:
["Mary is a five-year old girl.", "Mary likes playing piano.", "Mary doesn't like cookies."]

Limit the number of claims to the top 5 most important claims. If there are more than 5 claims, return the top 5 most important claims. If there are less than 5 claims, return all the claims.
Now complete the following, ONLY RESPONSE IN A LIST FORMAT, NO OTHER WORDS!!! START YOUR RESPONSE WITH '[' AND END WITH ']':

User Input:
decompose("{doc}")
Response:
"""

CHECKWORTHY_PROMPT = """
Your task is to identify whether texts are checkworthy in the context of fact-checking.
Let's define a function named checkworthy(input: List[str]).
The return value should be a list of strings, where each string selects from ["Yes", "No"].
"Yes" means the text is a factual checkworthy statement.
"No" means that the text is not checkworthy, it might be an opinion, a question, or others.
The length of the returned list must exactly match the length of the user input list.

For example:
User Input:
checkworthy(["I think Apple is a good company.", "Friends is a great TV series.", "Are you sure Preslav is a professor in MBZUAI?", "The Stanford Prison Experiment was conducted in the basement of Encina Hall.", "As a language model, I can't provide these info."])
Response: 
["No", "Yes", "No", "Yes", "No"]

Now complete the following, ONLY RESPONSE IN A LIST FORMAT, NO OTHER WORDS!!! START YOUR RESPONSE WITH '[' AND END WITH ']'. THE LENGTH OF THE RESPONSE LIST SHOULD BE THE SAME AS THE INPUT LIST:
User Input:
checkworthy({texts})
Response:
"""

QGEN_PROMPT = """

Your task is to generate questions from the given text.

For each text, generate questions to verify the text.

For example:
Text: Your nose switches back and forth between nostrils. When you sleep, you switch about every 45 minutes. This is to prevent a buildup of mucus. It’s called the nasal cycle.
Questions:
1. Does your nose switch between nostrils?
2. How often does your nostrils switch?
3. Why does your nostril switch?
4. What is nasal cycle?

Text: The Stanford Prison Experiment was conducted in the basement of Encina Hall, Stanford’s psychology building.
Questions:
1. Where was Stanford Prison Experiment was conducted?

Text: The Havel-Hakimi algorithm is an algorithm for converting the adjacency matrix of a graph into its adjacency list. It is named after Vaclav Havel and Samih Hakimi.
Questions:
1. What does Havel-Hakimi algorithm do?
2. Who are Havel-Hakimi algorithm named after?

End of examples.

Now complete the following. For the text, generate questions to verify the following text. If you can't generate a question, leave the questions empty and return nothing. START YOUR RESPONSE WITH THE QUESTIONS, DO NOT INCLUDE THE TEXT IN YOUR RESPONSE.
Text: {claim}
Questions:
""".strip()

VERIFY_PROMPT = """
You are given a piece of text. Your task is to identify whether there are any factual errors within the text.
When you are judging the factuality of the given text, you could reference the provided evidences if needed. The provided evidences may be helpful. Some evidences may contradict to each other. You must be careful when using the evidences to judge the factuality of the given text.
The response should be a dictionary with three keys - "reasoning", "factuality", "error", and "correction", which correspond to the reasoning, whether the given text is factual or not (Boolean - True or False), the factual error present in the text, and the corrected text.
The following is the given text
[text]: {claim}
The following is the provided evidences
[evidences]: {evidence}
You should only respond in format as described below. DO NOT RETURN ANYTHING ELSE. START YOUR RESPONSE WITH '{{'.
[response format]: 
{{
    "reasoning": "Why is the given text factual or non-factual? Be careful when you said something is non-factual. When you said something is non-factual, you must provide multiple evidences to support your decision.",
    "error": "None if the text is factual; otherwise, describe the error.",
    "correction": "The corrected text if there is an error.",
    "factuality": True if the given text is factual, False otherwise.
}}
"""

IDENTIFY_STANCE_PROMPT = """You are given a claim and an evidence text, and you need to decide whether the evidence supports, refutes, or is irrelevant to the claim. Choose from the following three options.
A. The evidence supports the claim.
B. The evidence refutes the claim.
C. The evidence is irrelevant to the claim.

For example, you are give Claim: "Preslav is a professor.", Evidence: "Preslav Nakov is a Professor in MBZUAI NLP group, and also the department chair." You should return A
Pick the correct option A, B, C without other words.

Claim: {claim}
Evidence: {evidence}"""

zero_shot_edit_response = """
Given a document containing factual errors, please correct the errors in the document depending on a corresponding list of factually true claims. Note that preserve the linguistic features and style of the original document, just correct factual errors.

document: {response}

true claims: {claims}

revised document:
"""

zero_shot_edit_response_given_question = """Given a question, and an answer containing factual errors, please correct the errors in the document depending on a corresponding list of factually true claims. Note that preserve the linguistic features and style of the original document, just correct factual errors.

question: {prompt}

document: {response}

true claims: {claims}

revised document: """

# Prompt for Question and Answer Generation with RAG
QUESTION_WITH_RAG_PROMPT = """Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.
Always say "thanks for asking!" at the end of the answer.

Context: {context}

Question: {question}

Response: """

TEXT_SUMMARIZATION_PROMPT = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Summarize the following text

### Input:
{input_text}

### Response:
"""

VIDEO_TRANSCRIPT_PROMPT = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{input_text}

### Input:
{video_transcript}

### Response:
"""

PDF_PROMPT = """Below is an instruction that describes a task, paired with an input that contains the contents extracted from a PDF file. Write a response that appropriately completes the request.

### Instruction:
{input_text}

### Input:
{md_text}

### Response:
"""