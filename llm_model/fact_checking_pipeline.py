from llm_multi_model import generateLLMOutput, loadMultiModalLLM
from copy import deepcopy
from unsloth import FastVisionModel
from transformers import AutoTokenizer
from sentence_transformers import CrossEncoder
from rag import rag_retrieval, load_embeddings_model, load_wikipedia_embeddings_model

from prompts import SENTENCES_TO_CLAIMS_PROMPT, CHECKWORTHY_PROMPT, QGEN_PROMPT, VERIFY_PROMPT, IDENTIFY_STANCE_PROMPT, zero_shot_edit_response_given_question, zero_shot_edit_response, QUESTION_WITH_RAG_PROMPT

import numpy as np
import pandas as pd
import concurrent.futures

import re
import bs4
import json
import nltk
import spacy
import torch
import itertools
import requests

embeddings_model = load_wikipedia_embeddings_model()

def load_question_duplicate_model():

    question_duplicate_model = CrossEncoder('cross-encoder/quora-roberta-base', device=torch.device("cuda:0" if torch.cuda.is_available() else "cpu"))
    question_duplicate_tokenizer = spacy.load("en_core_web_sm", disable = ["ner", "tagger", "lemmatizer"])

    return question_duplicate_model, question_duplicate_tokenizer

def load_passage_ranker():

    passage_ranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2",
    max_length=512,
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu"),
    )

    return passage_ranker

def fact_checking_pipeline(text: str, model: FastVisionModel, tokenizer: AutoTokenizer, question_duplicate_model: CrossEncoder, question_duplicate_tokenizer, passage_ranker: CrossEncoder) -> str:

    sentences = convert_text_to_sentences(text = text, model = model, tokenizer = tokenizer)
    checkworthy_results = identify_checkworthiness(texts = sentences, model = model, tokenizer = tokenizer)
    
    evidence = []
    for i, sentence in enumerate(sentences):
        if checkworthy_results[i].lower() == "yes":
            evidences = get_evidences_for_claim_rag(llm_model= model, tokenizer = tokenizer, claim = sentence, question_duplicate_model = question_duplicate_model, question_duplicate_tokenizer = question_duplicate_tokenizer, passage_ranker = passage_ranker)
            # evidences = get_web_evidences_for_claim(llm_model = model, tokenizer = tokenizer, claim = sentence, question_duplicate_model = question_duplicate_model, question_duplicate_tokenizer = question_duplicate_tokenizer, passage_ranker = passage_ranker)
            evids = [evid["text"] for evid in evidences["aggregated"]]
        else:
            evids = []

        evidence.append(evids)
    label, log = verify_document(sentences, evidence, model = model, tokenizer = tokenizer, num_retries = 3)
    log["checkworthy"] = checkworthy_results
    
    revised_text = revise_response(text, log["correction"].tolist(), model = model, tokenizer = tokenizer)

    return revised_text

# Functions to convert text to sentences

def doc_to_sentences(doc: str) -> list[str]:
    
    sentences = nltk.sent_tokenize(doc)
    sentences = [s.strip() for s in sentences if len(s.strip()) >= 3]
    
    return sentences

def convert_text_to_sentences(text: str, model: FastVisionModel, tokenizer: AutoTokenizer, num_retries = 3) -> list[str]:

    results = None
    user_input = SENTENCES_TO_CLAIMS_PROMPT.format(doc = text).strip()
    for _ in range(num_retries):
        try:
            r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are good at decomposing and decontextualizing text.")
            results = eval(r)
            break
        except Exception as e:
            print(f"An unexpected error occured: {e}")
    
    if isinstance(results, list):
        return results
    else:
        print(f"Model output error. It does not output a list of sentences correctly, return NLTK split results.")
        return doc_to_sentences(text)

# Functions to determine checkworthiness

def identify_checkworthiness(texts: list[str], model: FastVisionModel, tokenizer: AutoTokenizer, num_retries = 3) -> list[str]:

    results = ["Yes"] * len(texts)

    for _ in range(num_retries):
        try:
            user_input = CHECKWORTHY_PROMPT.format(texts = texts)
            r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are a helpful fact checker assistant.")
            results = eval(r)
            assert(len(results) == len(texts))
            break
        
        except AssertionError as e:
            print(f"An unexpected error occured: {e}")
            print(f"There is {len(texts)} claims, while {len(results)} checkworthy results.")
            results = ["Yes"] * len(texts)
            print(f"Returning default results.: {results}")
        
        except Exception as e:
            print(f"An unexpected error occured: {e}")

    return results

# Search RAG for evidences based on sentence

def get_evidences_for_claim_rag(llm_model: FastVisionModel, tokenizer: AutoTokenizer, claim: str, question_duplicate_model: CrossEncoder, question_duplicate_tokenizer, passage_ranker: CrossEncoder):

    evidences = dict()
    evidences["aggregated"] = list()

    questions = []
    while len(questions) <= 0:
        questions = run_question_generation(
            prompt = QGEN_PROMPT.format(claim = claim),
            model = llm_model,
            tokenizer = tokenizer,
            temperature = 0.7,
            num_rounds = 2
        )

    questions = list(set(questions))

    if len(questions) > 0:
        questions = remove_duplicate_questions(question_duplicate_model, questions)

    questions = list(questions)
    snippets = dict()

    for question in questions:
        snippets[question] = get_relevant_snippets_rag(question, question_duplicate_tokenizer, passage_ranker, max_search_results_per_query = 5, max_passages_per_search_result_to_return = 3)
        snippets[question] = deepcopy(sorted(snippets[question], key = lambda snippet: snippet["retrieval_score"], reverse = True)[:5])
    
    evidences['question_wise'] = deepcopy(snippets)
    while len(evidences["aggregated"]) < 5:
        for key in evidences["question_wise"]:
            if len(evidences["question_wise"][key]) == 0:
                print("No evidence found for question: ", key)
                evidences["aggregated"].append(                    
                    {
                        "text": ""
                    })
                continue
            # Take top evidences for each question
            index = int(len(evidences["aggregated"])/len(evidences["question_wise"]))
            evidences["aggregated"].append(evidences["question_wise"][key][index])
            if len(evidences["aggregated"]) >= 5:
                break

    return evidences
        
def get_relevant_snippets_rag(query: str, tokenizer, passage_ranker, timeout = 10, max_search_results_per_query = 5, max_passages_per_search_result_to_return = 2, sentences_per_passage = 5):

    search_results = rag_retrieval(query, embeddings_model, num_results = max_search_results_per_query)

    retrieved_passages = list()

    for result in search_results:
        retrieved_passages.append(
            {
                "text": result['text'],
                "retrieval_score": result['score']
            }
        )

    return retrieved_passages

    # retrieved_passages = list()

    # scores = passage_ranker.predict([(query, p) for p in search_results]).tolist()
    # passage_scores = list(zip(search_results, scores))

    # # Take the top passages_per_search passages for the current search results
    # passage_scores.sort(key = lambda x: x[1], reverse = True)

    # relevant_items = list()
    # for passage_item, score in passage_scores:
    #     overlap = False
    #     if len(relevant_items) > 0:
    #         for item in relevant_items:
    #             if passage_item[1] >= item[1] and passage_item[1] <= item[2]:
    #                 overlap = True
    #                 break
    #             if passage_item[2] >= item[1] and passage_item[2] <= item[2]:
    #                 overlap = True
    #                 break

    #     if not overlap:
    #         relevant_items.append(deepcopy(passage_item))
    #         retrieved_passages.append(
    #             {
    #                 "text": passage_item,
    #                 "retrieval_score": score, # Cross-encoder score as retr score
    #             }
    #         )
        
    #     if len(relevant_items) >= max_passages_per_search_result_to_return:
    #         break
    
    return retrieved_passages

# Search the web for evidences based on the sentence

def get_web_evidences_for_claim(llm_model: FastVisionModel, tokenizer: AutoTokenizer, claim: str, question_duplicate_model: CrossEncoder, question_duplicate_tokenizer, passage_ranker: CrossEncoder):

    evidences = dict()
    evidences["aggregated"] = list()

    questions = []
    while len(questions) <= 0:
        questions = run_question_generation(
            prompt = QGEN_PROMPT.format(claim = claim),
            model = llm_model,
            tokenizer = tokenizer,
            temperature = 0.7,
            num_rounds = 2
        )

    questions = list(set(questions))

    if len(questions) > 0:
        questions = remove_duplicate_questions(question_duplicate_model, questions)
    
    questions = list(questions)
    snippets = dict()

    for question in questions:
        snippets[question] = get_relevant_snippets(question, question_duplicate_tokenizer, passage_ranker, max_search_results_per_query = 5, max_passages_per_search_result_to_return = 3)
        snippets[question] = deepcopy(sorted(snippets[question], key = lambda snippet: snippet["retrieval_score"], reverse = True)[:5])
    
    evidences['question_wise'] = deepcopy(snippets)
    while len(evidences["aggregated"]) < 5:
        for key in evidences["question_wise"]:
            if len(evidences["question_wise"][key]) == 0:
                print("No evidence found for question: ", key)
                evidences["aggregated"].append(                    
                    {
                        "text": ""
                    })
                continue
            # Take top evidences for each question
            index = int(len(evidences["aggregated"])/len(evidences["question_wise"]))
            if index >= len(evidences["question_wise"][key]):
                print("No evidence found for question: ", index)
                evidences["aggregated"].append(
                    {
                        "text": ""
                    })
                continue
            evidences["aggregated"].append(evidences["question_wise"][key][index])
            if len(evidences["aggregated"]) >= 5:
                break

    return evidences


def run_question_generation(prompt: str, model: FastVisionModel, tokenizer: AutoTokenizer, temperature, num_rounds, num_retries = 3) -> list[str]:

    questions = set()
    for _ in range(num_rounds):
        for _ in range(num_retries):
            try:
                r = generateLLMOutput(model, tokenizer, prompt, system_role = "You are tasked to verify the factuality of the provided statements by Googling and reference any related resources in your training data.")
                cur_round_questions = parse_api_response(r.strip())
                questions.update(cur_round_questions)
                break
            
            except Exception as e:
                print(f"{e}. Retrying...")
    
    questions = list(sorted(questions))

    return questions

def parse_api_response(response: str) -> list[str]:

    split_string = "."
    questions = []

    for question in response.split("\n"):
        if split_string not in question:
            continue
        question = question.split(split_string)[1].strip()
        questions.append(question)
    
    return questions

def remove_duplicate_questions(model: CrossEncoder, all_questions: list[str]) -> list[str]:

    qset = [all_questions[0]]
    for question in all_questions[1:]:
        q_list = [(q, question) for q in qset]
        scores = model.predict(q_list)
        if np.max(scores) < 0.60:
            qset.append(question)
        
    return qset

def get_relevant_snippets(query: str, tokenizer, passage_ranker, timeout = 10, max_search_results_per_query = 5, max_passages_per_search_result_to_return = 2, sentences_per_passage = 5):
    search_results = search_google(query, timeout = timeout)

    with concurrent.futures.ThreadPoolExecutor() as e:
        scraped_results = e.map(scrape_url, search_results, itertools.repeat(timeout))
    
    scraped_results = [r for r in scraped_results if r[0] and ".pdf" not in r[1]]

    retrieved_passages = list()
    for webtext, url in scraped_results[:max_search_results_per_query]:
        passages = chunk_text(text = webtext, tokenizer = tokenizer, sentences_per_passage = sentences_per_passage)
        if not passages:
            continue

        # Score the passages by relevance to the query using a cross-encoder
        scores = passage_ranker.predict([(query, p[0]) for p in passages]).tolist()
        passage_scores = list(zip(passages, scores))

        # Take the top passages_per_search passages for the current search results
        passage_scores.sort(key = lambda x: x[1], reverse = True)

        relevant_items = list()
        for passage_item, score in passage_scores:
            overlap = False
            if len(relevant_items) > 0:
                for item in relevant_items:
                    if passage_item[1] >= item[1] and passage_item[1] <= item[2]:
                        overlap = True
                        break
                    if passage_item[2] >= item[1] and passage_item[2] <= item[2]:
                        overlap = True
                        break
            
            if not overlap:
                relevant_items.append(deepcopy(passage_item))
                retrieved_passages.append(
                    {
                        "text": passage_item[0],
                        "url": url,
                        "sents_per_passage": sentences_per_passage,
                        "retrieval_score": score, # Cross-encoder score as retr score
                    }
                )

            if len(relevant_items) >= max_passages_per_search_result_to_return:
                break
        
    
    return retrieved_passages

def search_google(query: str, num_web_pages: int = 1, timeout: int = 6, save_url: str = '') -> list[str]:

    query = query.replace(" ", "+")

    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:65.0) Gecko/20100101 Firefox/65.0"
    # mobile user-agent
    MOBILE_USER_AGENT = "Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36"
    headers = {'User-Agent': USER_AGENT}

    lang = "en"
    urls = []
    for page in range(0, num_web_pages, 10):
        url = "https://www.google.com/search?q={}&lr=lang_{}&hl={}&start={}".format(query, lang, lang, page)
        r = requests.get(url, headers = headers, timeout = timeout)
        urls += re.findall('href="(https?://.*?)"', r.text)
    
    urls = list(set(urls))
    print(urls)

    if not save_url == "":
        with open(save_url, 'w') as file:
            for url in urls:
                file.write(url + "\n")
    
    return urls

def chunk_text(text:str, tokenizer, sentences_per_passage: int = 5, filter_sentence_len: int = 250, sliding_distance: int = 2) -> list[str]:
    if not sliding_distance or sliding_distance > sentences_per_passage:
        sliding_distance = sentences_per_passage
    assert sentences_per_passage > 0 and sliding_distance > 0

    passages = []
    try:
        doc = tokenizer(text[:500000])  # Take 500k chars to not break tokenization.
        sents = [
            s.text.replace("\n", " ")
            for s in doc.sents
            if len(s.text) <= filter_sentence_len
        ]
        for idx in range(0, len(sents), sliding_distance):
            passages.append((" ".join(sents[idx : idx + sentences_per_passage]), idx, idx + sentences_per_passage - 1))
    except UnicodeEncodeError as _:
        print("Unicode error when using Spacy. Skipping text.")
    
    return passages

def is_tag_visible(element: bs4.element) -> bool:
    if element.parent.name in [
        "style",
        "script",
        "head",
        "title",
        "meta",
        "[document]",
    ] or isinstance(element, bs4.element.Comment):
        return False

    return True

def scrape_url(url: str, timeout: float = 3) -> tuple[str, str]:
    # Scrape the URL
    try:
        response = requests.get(url, timeout = timeout)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return None, url
    
    # Extract out all the text from the tags
    try:
        soup = bs4.BeautifulSoup(response.text, "html.parser")
        texts = soup.findAll(string = True)

        visible_text = filter(is_tag_visible, texts)
    except Exception as e:
        return None, url
    
    web_text = " ".join(t.strip() for t in visible_text).strip()
    web_text = " ".join(web_text.split())
    return web_text, url

# Functions to verify the document

def verify_document(claims: list[str], evidence: list[list[str]], model: FastVisionModel, tokenizer: AutoTokenizer, num_retries = 3) -> any:

    results = []
    
    for claim, evidence_list in zip(claims, evidence):
        result = verify_claim(claim, evidence_list, model = model, tokenizer = tokenizer, num_retries = num_retries)
        result["claim"] = claim
        result["evidence"] = evidence_list
        results.append(result)
    
    df = pd.DataFrame(results)

    return all(df["factuality"]), df

def verify_claim(claim: str, evidences: list[str], model: FastVisionModel, tokenizer: AutoTokenizer, num_retries = 3) -> dict[str, any]:

    results = {}
    user_input = VERIFY_PROMPT.format(claim = claim, evidence = evidences)
    # print(user_input)

    for _ in range(num_retries):
        try:
            r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are a helpful factchecker assistant")
            results = eval(r)
            break
        except Exception as e:
            print(f"An unexpected error occured: {e}")

    if isinstance(results, dict):
        return results
    else:
        print(f"Error output {r}. It does not output a dict, return factual label by stance aggregation.")
        factual_label = verify_by_stance(claim, evidences, model)
        results = {
            "reasoning": "",
            "error": "",
            "correction": "",
            "factuality": factual_label
        }
        return results
    
stance_map = {
    "A": "support",
    "B": "refute",
    "C": "irrelevant"
}

def parse_stance_results(r):
    try:
        return stance_map[r[0]]
    except KeyError:
        if "A" in r and "support" in r:
            return "support"
        elif "B" in r and "refute" in r:
            return "refute"
        elif "C" in r and "irrelevant" in r:
            return "irrelevant"
    except Exception as e:
        print(f"An unexpected error occurred: {r}.")
        return "irrelevant"


def stance(evidence, claim, model: FastVisionModel, tokenizer: AutoTokenizer) -> str:
    prompt = IDENTIFY_STANCE_PROMPT.format(claim = claim, evidence = evidence)
    r = generateLLMOutput(model, tokenizer, prompt, system_role = "You are a helpful factchecker assistant")

    return parse_stance_results(r)

def verify_by_stance(claim: str, evidences: list[str], model: FastVisionModel, tokenizer: AutoTokenizer) -> any:
    labels = []
    for evidence in evidences:
        labels.append(stance(evidence, claim, model=model))
    
    # based on stances of evidence, determine the true/false claim by rules
    # if there is one evidence supports, we assume it is correct
    if "support" in labels:
        return True
    # if there isn't support, but refute and irrelevant, we regard as false
    elif "refute" in labels:
        return False
    else:
        # all irrelevant
        return False

def revise_response(response: str, claim_list: list[str], model: FastVisionModel, tokenizer: AutoTokenizer, question = None, prompt_mode = ["with-question", "no-question"][1]) -> str:

    if prompt_mode == "with-question":
        user_input = zero_shot_edit_response_given_question.format(prompt = question, response = response, claims = claim_list)
    else:
        user_input = zero_shot_edit_response.format(response = response, claims = claim_list)
    
    r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are good at correcting factual errors depending on correct claims.")

    return r


llm_model, tokenizer = loadMultiModalLLM()
passage_ranker = load_passage_ranker()
question_duplicate_model, question_duplicate_tokenizer = load_question_duplicate_model()
# summarized_text = "Machine learning (ML) is not an artificial intelligence (AI). ML is focused on developing algorithms and statistical models that enable computers to perform tasks without explicit programming. Instead of relying on pre-defined instructions, machine learning systems learn patterns and relationships from data to make predictions or decisions. At its core, ML can be categorized into three main types: supervised learning, unsupervised learning, and reinforcement learning. In supervised learning, algorithms are trained on labeled datasets, where the input-output pairs are explicitly provided, making it suitable for tasks like classification and regression. Unsupervised learning, on the other hand, deals with unlabeled data, using techniques such as clustering and dimensionality reduction to discover hidden patterns. Reinforcement learning involves an agent interacting with an environment, learning optimal strategies through rewards and penalties. Common algorithms include decision trees, support vector machines, neural networks, and k-means clustering. Machine learning has found applications in diverse fields, including natural language processing, computer vision, recommendation systems, and autonomous vehicles. However, ML models are not without challenges; issues such as data bias, overfitting, and interpretability remain significant concerns in the field. As technology advances, machine learning continues to play a critical role in driving innovation and solving complex problems across industries."

# result = fact_checking_pipeline(summarized_text, llm_model, tokenizer, question_duplicate_model, question_duplicate_tokenizer, passage_ranker)
# print(result)

# passage_ranker = load_passage_ranker()
# query = "What is self attention?"
# results = get_relevant_snippets_rag(query = query, tokenizer = None, passage_ranker = passage_ranker)
# print(results)

def load_json_lines(filename):
    data = []
    with open(filename, 'r') as file:
        for line in file:
            data.append(json.loads(line.strip()))
    return data

def evaluate_fact_checking_pipeline():

    check_claims_json = load_json_lines("fact_checking_evaluation_data/claims.jsonl")

    factual_labels = []

    for claim in check_claims_json:
        claim_text = claim["claim"]
        # print(claim_text)
        evidences = get_evidences_for_claim_rag(llm_model = llm_model, tokenizer = tokenizer, claim = claim_text, question_duplicate_model = question_duplicate_model, question_duplicate_tokenizer = question_duplicate_tokenizer, passage_ranker = passage_ranker)
        evids = [evid["text"] for evid in evidences["aggregated"]]
        # print(evids)
        result = verify_claim(claim_text, evids, model = llm_model, tokenizer = tokenizer)
        # print(result)
        factual_labels.append(result["factuality"])
        # return factual_labels
    
    updated_data = [
        {**item, 'claim_label': bool_value}
        for item, bool_value in zip(check_claims_json, factual_labels)
    ]

    with open("fact_checking_evaluation_data/claims_with_labels.jsonl", 'w') as file:
        for item in updated_data:
            file.write(json.dumps(item) + "\n")

    return

def evaluate_normal():

    check_claims_json = load_json_lines("fact_checking_evaluation_data/claims.jsonl")

    factual_labels = []

    for claim in check_claims_json:
        claim_text = claim["claim"]
        result = verify_claim(claim_text, [], llm_model, tokenizer)
        factual_labels.append(result["factuality"])
    
    updated_data = [
        {**item, 'claim_label': bool_value}
        for item, bool_value in zip(check_claims_json, factual_labels)
    ]

    with open("fact_checking_evaluation_data/claims_with_labels_without_rag.jsonl", 'w') as file:
        for item in updated_data:
            file.write(json.dumps(item) + "\n")

    return


check_claims_json = load_json_lines("fact_checking_evaluation_data/claims_with_labels.jsonl")

factual_labels = []
for claim in check_claims_json:
    claim_label = claim["claim_label"]
    factual_labels.append(not claim_label)

updated_data = [
        {**item, 'claim_label': bool_value}
        for item, bool_value in zip(check_claims_json, factual_labels)
    ]

with open("fact_checking_evaluation_data/claims_with_labels_inverted.jsonl", 'w') as file:
    for item in updated_data:
        file.write(json.dumps(item) + "\n")
