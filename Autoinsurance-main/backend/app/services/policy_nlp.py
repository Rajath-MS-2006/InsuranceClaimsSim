import os
import spacy
from pydantic import BaseModel
from typing import List, Optional
from app.ontology.semantic_matcher import SemanticMatcher
import re

class PolicyRule(BaseModel):
    category: str
    cap_amount: Optional[float] = None
    copay_percentage: Optional[float] = None
    is_excluded: bool = False
    raw_clause: str

class PolicyParser:
    def __init__(self, use_offline=True):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("Warning: en_core_web_sm not found. Run `python -m spacy download en_core_web_sm`")
            self.nlp = None

        self.matcher = SemanticMatcher(use_offline=use_offline)
        
    def parse_policy_text(self, policy_text: str) -> List[PolicyRule]:
        """
        Parses raw unstructured policy text into structured deterministic rules exactly matching
        the SemanticMatcher's categories.
        """
        rules = []
        if not self.nlp:
            return rules
            
        doc = self.nlp(policy_text)
        
        # NLP analysis per sentence
        for sent in doc.sents:
            text = sent.text.lower()
            original_text = sent.text.strip()
            
            # Analyze intent / exclusions
            is_exclusion = any(term in text for term in ["not covered", "exclude", "exclusion", "strictly excluded", "does not cover", "not included", "not payable"])
            
            # Look for copays (explicit mention of copay)
            is_copay = "copay" in text or "co-pay" in text
            
            # Extract capabilities via NER or RegEx
            # RegEx to find numbers
            money_vals = []
            for ent in sent.ents:
                if ent.label_ in ("MONEY", "CARDINAL"):
                    # remove non numeric characters like Rs or commas
                    cleaned = re.sub(r'[^\d.]', '', ent.text)
                    try:
                        if cleaned:
                            money_vals.append(float(cleaned))
                    except ValueError:
                        pass
            
            # Identify core subject of sentence for semantic matching
            # Filter out generic stop words and verbs to focus on the noun chunks
            subjects = [chunk.text for chunk in sent.noun_chunks if chunk.text.lower() not in ["we", "they", "insurance", "policy", "it", "claims", "the claims"]]
            subject_text = " ".join(subjects) if subjects else original_text
            
            if is_copay:
                # Find percentages via Regex or SpaCy
                percentages = [ent.text for ent in sent.ents if ent.label_ == "PERCENT"]
                if percentages:
                    copay_val = float(re.sub(r'[^\d.]', '', percentages[0]))
                else:
                    copay_match = re.search(r'(\d+)%', text)
                    if copay_match:
                        copay_val = float(copay_match.group(1))
                    else:
                        copay_val = 10.0 # Default fallback
                
                rules.append(PolicyRule(category="All", copay_percentage=copay_val, raw_clause=original_text))
                continue
                
            # Classify using semantic matching
            match_data = self.matcher.match_item(subject_text, threshold=0.3)
            cat = match_data["category"]
            
            if is_exclusion:
                rules.append(PolicyRule(category=cat, is_excluded=True, raw_clause=original_text))
            elif money_vals and any(limit_word in text for limit_word in ["cap", "limit", "up to", "maximum", "max"]):
                cap = max(money_vals) # Assume largest number is cap
                rules.append(PolicyRule(category=cat, cap_amount=cap, raw_clause=original_text))

        return rules

if __name__ == "__main__":
    parser = PolicyParser()
    sample_text = "Hospitalization room rent is capped at Rs 5000 per day. Cosmetic surgery is not covered. There is a 10% co-pay on all approved claims. Consumables are strictly excluded."
    rules = parser.parse_policy_text(sample_text)
    for r in rules:
        print(r)
